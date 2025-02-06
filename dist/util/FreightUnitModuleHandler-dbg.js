sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentModuleHandler",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"com/westernacher/collaborationportal/core/model/formatter"
], function (ParentModuleHandler, MessageBox, MessageToast, formatter) {
	"use strict";

	return ParentModuleHandler.extend("com.westernacher.collaborationportal.core.util.FreightUnitModuleHandler", {

		constructor: function (oController, sUpdateFUDialogId, sEntitySetName) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oComponent = oController;
			this.sEntitySetName = sEntitySetName;
			this.updateFUId = sUpdateFUDialogId ? sUpdateFUDialogId : "idUpdateFODialog";
		},

		formattingAmountsInLocale: function (oEvent) {
			formatter.convertPriceInLocaleFormat(oEvent);
		},

		onUpdateFreightUnitPress: function (SuccessCallback, ErrorCallback) {
			if (!this.oUpdateFUDialog) {
				var oFragment = sap.ui.xmlfragment(this.updateFUId,
					"com.westernacher.collaborationportal.core.fragment.UpdateFreightUnit",
					this);
				this.oUpdateFUDialog = oFragment;
				this._bindModelsToFragment(this.oUpdateFUDialog);
				this._bindItemDataToFragment(this._oComponent.getModel("_SD").getProperty("/SelectedItems"), this.oUpdateFUDialog);
				this.oUpdateFUDialog.open();
			}
			this.SuccessCallback = SuccessCallback;
			this.ErrorCallback = ErrorCallback;

		},
		onUpdateFreightUnitConfirmed: function () {
			var oFOBase = this._fetchFUUpdateData();
			if (!oFOBase) {
				return;
			}
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			//var oFragmentContext = this.oUpdateFUDialog.getBindingContext().getObject();

			for (var i = 0; i < aFOs.length; i++) {
				var oFO = jQuery.extend(true, {}, oFOBase);
				oFO.FreightUnitID = aFOs[i].getProperty("FreightUnitID");
				//oFO.TransportationOrderUUID_F = aFOs[i].getProperty("TransportationOrderUUID_F");

				//this.getModel().create(this.sEntitySetName, oFO, this.getStandardParameters(this.SuccessCallback, this.ErrorCallback));
				this.getModel().update(aFOs[i].getPath(), oFO, this.getStandardParameters(this.SuccessCallback, this.ErrorCallback));
			}

			this.onUpdateFreightUnitCancel();

		},

		onUpdateFreightUnitCancel: function () {
			this.oUpdateFUDialog.close();
		},
		afterCloseUpdateFreightUnitDialog: function () {
			this.oUpdateFUDialog.destroy();
			this.oUpdateFUDialog = null;
		},
		_fetchFUUpdateData: function () {

			var oFO = {};

			var oLoadReadyDateDP = sap.ui.getCore().byId(this.updateFUId + "--idUFULoadReadyDate");
			var oLoadReadyDate = oLoadReadyDateDP.getDateValue();
			if (!oLoadReadyDate && oLoadReadyDateDP.getRequired()) {
				oLoadReadyDateDP.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oLoadReadyDateDP.setValueState(sap.ui.core.ValueState.None);
				oFO.LoadReadyDate = oLoadReadyDate;
			}

			var oGrossWeight = sap.ui.getCore().byId(this.updateFUId + "--idEditFUWeight");
			var sGrossWeight = oGrossWeight.getValue();
			if (!sGrossWeight && sGrossWeight.getRequired()) {
				oGrossWeight.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oGrossWeight.setValueState(sap.ui.core.ValueState.None);
				oFO.LoadWeight = formatter.customCurrencyParser(sGrossWeight);
			}

			var oGrossVolume = sap.ui.getCore().byId(this.updateFUId + "--idEditFUVolume");
			var sGrossVolume = oGrossVolume.getValue();
			if (!sGrossVolume && sGrossVolume.getRequired()) {
				oGrossVolume.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oGrossVolume.setValueState(sap.ui.core.ValueState.None);
				oFO.LoadQuantity = formatter.customCurrencyParser(sGrossVolume);
			}

			oFO.LoadEquipmentType = sap.ui.getCore().byId(this.updateFUId + "--idEditFUMOT").getValue();
			oFO.SCAC = sap.ui.getCore().byId(this.updateFUId + "--idEditFUSCAC").getValue();
			return oFO;
		}

	});
});