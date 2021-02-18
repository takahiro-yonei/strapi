'use strict';

const { difference, pick, orderBy, prop, intersection } = require('lodash/fp');
const pmap = require('p-map');
const { getService } = require('../../../utils');

const before = () => {};

const after = async ({ model, definition, previousDefinition, ORM }) => {
  const ctService = getService('content-types');
  const localeService = getService('locales');

  if (!ctService.isLocalized(model)) {
    return;
  }

  const localizedAttributes = ctService.getLocalizedFields(definition);
  const prevLocalizedAttributes = ctService.getLocalizedFields(previousDefinition);
  const attributesDisabled = difference(prevLocalizedAttributes, localizedAttributes);
  const attributesToMigrate = intersection(Object.keys(definition.attributes), attributesDisabled);

  if (attributesToMigrate.length === 0) {
    return;
  }

  let locales = await localeService.find();
  locales = await localeService.setIsDefault(locales);
  locales = orderBy(['isDefault', 'code'], ['desc', 'asc'])(locales); // Put default locale first

  const processedLocaleCodes = [];

  for (const locale of locales) {
    const batchSize = 1000;
    let offset = 0;
    let batchCount = 1000;
    while (batchCount === batchSize) {
      if (model.orm === 'bookshelf') {
        const batch = await ORM.knex
          .select([...attributesToMigrate, 'locale', 'localizations'])
          .from(model.collectionName)
          .where('locale', locale.code)
          .orderBy('id')
          .offset(offset)
          .limit(batchSize);
        batch.forEach(entry => (entry.localizations = JSON.parse(entry.localizations)));

        batchCount = batch.length;
        const entriesToProcess = batch.filter(
          entry =>
            entry.localizations.length > 1 &&
            intersection(entry.localizations.map(prop('locale')), processedLocaleCodes).length === 0
        );

        const queries = entriesToProcess.map(entry => {
          const newAttributes = pick(attributesToMigrate, entry);
          const entriesIdsToUpdate = entry.localizations
            .filter(related => related.locale !== locale.code)
            .map(prop('id'));
          return ORM.knex
            .update(newAttributes)
            .from(model.collectionName)
            .whereIn('id', entriesIdsToUpdate);
        });

        await pmap(queries, query => query, { concurrency: 100, stopOnError: true });

        offset += batchSize;
      }
    }
    processedLocaleCodes.push(locale.code);
  }
};

module.exports = {
  before,
  after,
};
