sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentModuleHandler",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"com/westernacher/collaborationportal/core/model/formatter"
], function (ParentModuleHandler, MessageBox, MessageToast, formatter) {
	"use strict";

	return ParentModuleHandler.extend("com.westernacher.collaborationportal.core.util.FreightBookingModuleHandler", {

		constructor: function (oController, sUpdateFBDialogId, sEntitySetName) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oComponent = oController;
			this.sEntitySetName = sEntitySetName;
			this.updateFBId = sUpdateFBDialogId ? sUpdateFBDialogId : "idUpdateFBDialog";
		},

		formattingAmountsInLocale: function (oEvent) {
			formatter.convertPriceInLocaleFormat(oEvent);
		},

		onUpdateFreightBookingPress: function (SuccessCallback, ErrorCallback) {
			if (!this.oUpdateFBDialog) {
				var oFragment = sap.ui.xmlfragment(this.updateFBId,
					"com.westernacher.collaborationportal.core.fragment.UpdateFreightBooking",
					this);
				this.oUpdateFBDialog = oFragment;
				this._bindModelsToFragment(this.oUpdateFBDialog);
				this._bindItemDataToFragment(this._oComponent.getModel("_SD").getProperty("/SelectedItems"), this.oUpdateFBDialog);
				this.oUpdateFBDialog.open();
			}
			this.SuccessCallback = SuccessCallback;
			this.ErrorCallback = ErrorCallback;

		},
		onUpdateFreightBookingConfirmed: function () {
			var oFOBase = this._fetchFBUpdateData();
			if (!oFOBase) {
				return;
			}
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			//var oFragmentContext = this.oUpdateFBDialog.getBindingContext().getObject();

			for (var i = 0; i < aFOs.length; i++) {
				var oFO = jQuery.extend(true, {}, oFOBase);
				oFO.FreightBookingID = aFOs[i].getProperty("FreightBookingID");
				oFO.TransportationOrderUUID = aFOs[i].getProperty("TransportationOrderUUID");

				//this.getModel().create(this.sEntitySetName, oFO, this.getStandardParameters(this.SuccessCallback, this.ErrorCallback));
				this.getModel().update(aFOs[i].getPath(), oFO, this.getStandardParameters(this.SuccessCallback, this.ErrorCallback));
			}

			this.onUpdateFreightBookingCancel();

		},

		onUpdateFreightBookingCancel: function () {
			this.oUpdateFBDialog.close();
		},
		afterCloseUpdateFreightBookingDialog: function () {
			this.oUpdateFBDialog.destroy();
			this.oUpdateFBDialog = null;
		},
		_fetchFBUpdateData: function () {

			var oFO = {};

			//Ocean Booking Number
			var oPartnerReferenceNumber = sap.ui.getCore().byId(this.updateFBId + "--idFBPartnerRefNumber");
			var sPartnerReferenceNumber = oPartnerReferenceNumber.getValue();
			if (!sPartnerReferenceNumber && oPartnerReferenceNumber.getRequired()) {
				oPartnerReferenceNumber.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oPartnerReferenceNumber.setValueState(sap.ui.core.ValueState.None);
				oFO.PartnerReferenceNumber = sPartnerReferenceNumber;
			}

			//Carrier Master BOL umber
			var oCarrierMasterBoL = sap.ui.getCore().byId(this.updateFBId + "--idFBCarrierMasterBoL");
			var sCarrierMasterBoL = oCarrierMasterBoL.getValue();
			if (!sCarrierMasterBoL && sCarrierMasterBoL.getRequired()) {
				oCarrierMasterBoL.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oCarrierMasterBoL.setValueState(sap.ui.core.ValueState.None);
				oFO.CarrierMasterBoLNumber = sCarrierMasterBoL;
			}

			return oFO;
		}

	});
});