sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentModuleHandler",
	"sap/m/MessageBox",
	"sap/ui/model/Filter"
], function (ParentModuleHandler, MessageBox, Filter) {
	"use strict";

	return ParentModuleHandler.extend("com.westernacher.collaborationportal.fosExecution.util.ExecutionHandler", {
		//updateFOId: ,
		constructor: function (oComponent) {
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._oMDModel = oComponent.getModel("_MD");
		},
		onUpdateFreightOrderPress: function (SuccessCallback, ErrorCallback) {
			this._oComponent._FOH.onUpdateFreightOrderPress(SuccessCallback, ErrorCallback);
		},
	
		onCompleteFOPress: function (oButton, SuccessCallback, ErrorCallback) {
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			this._oComponent._AH.onActionNoInputPress(aFOs, oButton, SuccessCallback, ErrorCallback);
		},

		onCancelFOPress: function (oButton, SuccessCallback, ErrorCallback) {
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			this._oComponent._AH.onActionNoInputPress(aFOs, oButton, SuccessCallback, ErrorCallback);
		}
	});
});