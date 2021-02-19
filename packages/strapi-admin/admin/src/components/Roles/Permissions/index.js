import React, { forwardRef, memo, useCallback, useImperativeHandle, useReducer } from 'react';
import PropTypes from 'prop-types';
import Tabs from '../Tabs';
import PermissionsDataManagerProvider from '../PermissionsDataManagerProvider';
import ContentTypes from '../ContentTypes';
import PluginsAndSettings from '../PluginsAndSettings';
import layout from '../temp/fakeData';
import TAB_LABELS from './utils/tabLabels';
import formatPermissionsToAPI from './utils/formatPermissionsToAPI';
import init from './init';
import reducer, { initialState } from './reducer';

const Permissions = forwardRef(({ layout, isFormDisabled, permissions }, ref) => {
  const [{ layouts, modifiedData }, dispatch] = useReducer(reducer, initialState, () =>
    init(layout, permissions)
  );

  useImperativeHandle(ref, () => {
    return {
      getPermissions: () => {
        return formatPermissionsToAPI(modifiedData);
      },
      resetForm: () => {
        dispatch({ type: 'RESET_FORM' });
      },
      setFormAfterSubmit: () => {
        dispatch({ type: 'SET_FORM_AFTER_SUBMIT' });
      },
    };
  });

  const handleChangeCollectionTypeLeftActionRowCheckbox = (
    pathToCollectionType,
    propertyName,
    rowName,
    value
  ) => {
    dispatch({
      type: 'ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX',
      pathToCollectionType,
      propertyName,
      rowName,
      value,
    });
  };

  const handleChangeCollectionTypeGlobalActionCheckbox = (collectionTypeKind, actionId, value) => {
    dispatch({
      type: 'ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX',
      collectionTypeKind,
      actionId,
      value,
    });
  };

  const handleChangeConditions = conditions => {
    dispatch({ type: 'ON_CHANGE_CONDITIONS', conditions });
  };

  const handleChangeSimpleCheckbox = useCallback(({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE_SIMPLE_CHECKBOX',
      keys: name,
      value,
    });
  }, []);

  const handleChangeParentCheckbox = useCallback(({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE_TOGGLE_PARENT_CHECKBOX',
      keys: name,
      value,
    });
  }, []);

  return (
    <PermissionsDataManagerProvider
      value={{
        availableConditions: layout.conditions,
        modifiedData,
        onChangeConditions: handleChangeConditions,
        onChangeSimpleCheckbox: handleChangeSimpleCheckbox,
        onChangeParentCheckbox: handleChangeParentCheckbox,
        onChangeCollectionTypeLeftActionRowCheckbox: handleChangeCollectionTypeLeftActionRowCheckbox,
        onChangeCollectionTypeGlobalActionCheckbox: handleChangeCollectionTypeGlobalActionCheckbox,
      }}
    >
      <Tabs tabsLabel={TAB_LABELS}>
        <ContentTypes
          layout={layouts.collectionTypes}
          kind="collectionTypes"
          isFormDisabled={isFormDisabled}
        />
        <ContentTypes
          layout={layouts.singleTypes}
          kind="singleTypes"
          isFormDisabled={isFormDisabled}
        />
        <PluginsAndSettings
          layout={layouts.plugins}
          kind="plugins"
          isFormDisabled={isFormDisabled}
        />
        <PluginsAndSettings
          layout={layouts.settings}
          kind="settings"
          isFormDisabled={isFormDisabled}
        />
      </Tabs>
    </PermissionsDataManagerProvider>
  );
});

Permissions.defaultProps = {
  permissions: [],
  layout,
};
Permissions.propTypes = {
  layout: PropTypes.object,
  isFormDisabled: PropTypes.bool.isRequired,
  permissions: PropTypes.array,
};

export default memo(Permissions);
