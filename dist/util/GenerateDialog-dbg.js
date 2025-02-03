sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox"
], function (UI5Object, MessageBox) {
	"use strict";

	return UI5Object.extend("com.westernacher.collaborationPortal.core.util.GenerateDialog", {

		constructor: function (oController, oView) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oModel = oController.getModel();
		}

	});
});