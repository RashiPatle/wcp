sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ParentModuleHandler",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"com/westernacher/collaborationPortal/core/model/formatter"
], function (ParentModuleHandler, MessageBox, Filter, CoreFormatter) {
	"use strict";

	return ParentModuleHandler.extend("com.westernacher.collaborationPortal.quotation.util.QuotationHandler", {
		formatter: CoreFormatter,
		acceptPriceChangeId: 'idFOPriceChangeDialog',
		rejectFOId: 'idRejectFODialog',
		constructor: function (oComponent) {
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._oMDModel = oComponent.getModel("_MD");
		},
		onAcceptWithChangePress: function (SuccessCallback, ErrorCallback, oController) {
			if (!this.oAcceptPriceChangeDialog) {
				var oFragment = sap.ui.xmlfragment(this.acceptPriceChangeId,
					"com.westernacher.collaborationPortal.quotation.fragment.AcceptPriceChange",
					this);
				this.oAcceptPriceChangeDialog = oFragment;
				this._bindModelsToFragment(this.oAcceptPriceChangeDialog);
				this._bindItemDataToFragment(this._oComponent.getModel("_SD").getProperty("/SelectedItems"), this.oAcceptPriceChangeDialog);
				this.oAcceptPriceChangeDialog.open();
			}
			this.SuccessCallback = SuccessCallback;
			this.ErrorCallback = ErrorCallback;
			this.oController = oController;
		},
		onRejectFOPress: function (SuccessCallback, ErrorCallback, oController) {
			if (!this.oRejectFOQDialog) {
				var oFragment = sap.ui.xmlfragment(this.rejectFOId,
					"com.westernacher.collaborationPortal.quotation.fragment.RejectionReasonCode",
					this);
				this.oRejectFOQDialog = oFragment;
				this._bindModelsToFragment(this.oRejectFOQDialog);
				this._bindItemDataToFragment(this._oComponent.getModel("_SD").getProperty("/SelectedItems"), this.oRejectFOQDialog);
				this._oComponent._MD.callEntitySetDataLoad("I_TenderingRejectionReason", "RejectionReason");

				this.oRejectFOQDialog.open();
			}
			this.SuccessCallback = SuccessCallback;
			this.ErrorCallback = ErrorCallback;
			this.oController = oController;
		},
		onAcceptPriceChangeCancel: function () {
			this.oAcceptPriceChangeDialog.close();
			this.oAcceptPriceChangeDialog.destroy();
			this.oAcceptPriceChangeDialog = null;
		},
		onRejectionReasonCancel: function () {
			this.oRejectFOQDialog.close();
			this.oRejectFOQDialog.destroy();
			this.oRejectFOQDialog = null;
		},
		/**
		 * Fired when the value of AcceptPriceChange value changes
		 * @param {sap.ui.base.Event} [oEvent] oSource and oParameters of control
		 * 
		 */
		onAceeptPriceChange: function (oEvent) {
			var sCurrency = oEvent.getSource().getBindingContext().getObject().TenderingPreferredCurrency;
			CoreFormatter.convertPriceInLocaleFormat(oEvent, sCurrency);
		},
		/**
		 * Fired when the value of AcceptPriceLiveChange value changes
		 * @param {sap.ui.base.Event} [oEvent] oSource and oParameters of control
		 * 
		 */
		onAcceptPriceLiveChange: function (oEvent) {
			this.formatter.validatePriceInLocale(oEvent);
		},

		_fetchFOUpdateData: function () {
			var oFO = {},
				oContext = this.oAcceptPriceChangeDialog.getBindingContext(),
				sTRN = oContext.getProperty("TenderingRequestNumber"),
				sFOUUID = oContext.getProperty("TransportationOrderUUID");
			var oPriceLimitDP = sap.ui.getCore().byId(this.acceptPriceChangeId + "--idTendPriceChange");
			var oPriceLimit = oPriceLimitDP.getValue(),
				oCurr = oPriceLimitDP.getDescription();
			if (!oPriceLimit && oPriceLimitDP.getRequired()) {
				oPriceLimitDP.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oPriceLimitDP.setValueState(sap.ui.core.ValueState.None);
				oFO.TenderingRequestNumber = sTRN;
				//	oFO.TransportationOrderUUID = sFOUUID;

				// Removes decimal group character from price Ex: Comma in '1,000.00' TndrgRspSubmdAmt
				oFO.TndrgRspSubmdAmt = CoreFormatter.customCurrencyParser(oPriceLimit);

				oFO.TndrgRspSubmdAmtCrcy = oCurr;

				if (parseFloat(oFO.TndrgRspSubmdAmt) === 0) {
					oPriceLimitDP.setValueState(sap.ui.core.ValueState.Error);
					return false;
				}

			}

			return oFO;
		},

		onUpdateCargoItemCancel: function () {
			this.oUpdateCargoItemDialog.close();
		},

		afterCloseUpdateCargoItemDialog: function () {
			this.oUpdateCargoItemDialog.destroy();
			this.oUpdateCargoItemDialog = null;
		},
		onAcceptNewPrice: function () {
			var oFOBase = this._fetchFOUpdateData();
			if (!oFOBase) {
				return;
			}
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");

			for (var i = 0; i < aFOs.length; i++) {
				var oTrenderingReqNumber = this._oComponent.getModel("_SD").getProperty("/SelectedItems")[i].getProperty(
					"TenderingRequestNumber");
				//	var oFOUUID = this._oComponent.getModel("_SD").getProperty("/SelectedItems")[i].getProperty(
				//		"TenderingResponseSqncNumber");
				var oFO = jQuery.extend(true, {}, oFOBase);
				var oEntityPath = "/ZWCP_C_Quotes(TenderingRequestNumber='" + oTrenderingReqNumber + "',TenderingResponseSqncNumber='0')";

				this.getModel().update(oEntityPath, oFOBase, this.getStandardParameters(this.SuccessCallback, this.ErrorCallback, this.oController));

				//this.getModel().update(aFOs[i].getPath(), oFOBase, this.getStandardParameters(this.SuccessCallback, this.ErrorCallback, this.oController));
			}
			this.onAcceptPriceChangeCancel();

		},
		onRejectQuotation: function (oEvent) {
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			this._oComponent._AH.onActionNoInputPress(aFOs, oEvent.getSource(), this.SuccessCallback, this.ErrorCallback);
			this.onRejectionReasonCancel();
		},

		onSelectionChangeRejReasonType: function (oEvent) {
			var sRejKey = oEvent.getSource().getSelectedKey();
			var oContext = this._oComponent.getModel("_SD").getProperty("/SelectedItems")[0];
			var sPath = oContext.sPath;
			oContext.getProperty(sPath).RejectionReasonCode = sRejKey;

			//	this._oComponent.getModel("_SD").setProperty("/TenderingRejectionReason", sRejKey);
		}

	});
});