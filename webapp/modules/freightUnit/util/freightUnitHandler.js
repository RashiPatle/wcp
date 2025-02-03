sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ParentModuleHandler",
	"sap/m/MessageBox",
	"sap/ui/model/Filter"
], function (ParentModuleHandler, MessageBox, Filter) {
	"use strict";

	return ParentModuleHandler.extend("com.westernacher.collaborationPortal.freightUnit.util.freightUnitHandler", {
		updateFUId: 'idUpdateFreightUnitDialog',
		constructor: function (oComponent) {
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._oMDModel = oComponent.getModel("_MD");
		},
		onUpdateFreightUnitPress: function (SuccessCallback, ErrorCallback, oController) {
			this._oComponent._FUH.onUpdateFreightUnitPress(SuccessCallback, ErrorCallback);
		},
	
		onCompleteFOPress: function (oButton) {
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			this._oComponent._AH.onActionNoInputPress(aFOs, oButton);
		},

		onCancelFOPress: function (oButton) {
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			this._oComponent._AH.onActionNoInputPress(aFOs, oButton);
		}
	});
});