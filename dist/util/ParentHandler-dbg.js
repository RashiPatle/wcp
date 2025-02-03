sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"com/westernacher/collaborationPortal/core/model/formatter"
], function (UI5Object, MessageBox, formatter) {
	"use strict";

	return UI5Object.extend("com.westernacher.collaborationPortal.core.util.ParentHandler", {
		coreFormatter: formatter,
		getModel: function () {
			if (!this._oModel) {
				this._oModel = this._oComponent.getModel();
			}
			return this._oModel;
		},
		getStandardParameters: function (fnSuccess, fnError) {
			return {
				success: function (oData, oResp) {
					if (oResp && oResp.message) {
						sap.m.MessageToast.show(oResp.message);
					}

					if (fnSuccess) {
						fnSuccess();
					}
				}.bind(this),
				error: function (oErr) {
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);

					if (fnError) {
						fnError();
					}
				}.bind(this)
			};
		}
	});
});