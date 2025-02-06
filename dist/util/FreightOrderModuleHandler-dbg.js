sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentModuleHandler",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (ParentModuleHandler, MessageBox, MessageToast) {
	"use strict";

	return ParentModuleHandler.extend("com.westernacher.collaborationportal.core.util.FreightOrderModuleHandler", {

		constructor: function (oController, sUpdateFODialogId) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oComponent = oController;
			this.updateFOId = sUpdateFODialogId ? sUpdateFODialogId : "idUpdateFODialog";
		},
		onUpdateFreightOrderPress: function (SuccessCallback, ErrorCallback) {
			if (!this.oUpdateFODialog) {
				var oFragment = sap.ui.xmlfragment(this.updateFOId,
					"com.westernacher.collaborationportal.core.fragment.UpdateFreightOrder",
					this);
				this.oUpdateFODialog = oFragment;
				this._bindModelsToFragment(this.oUpdateFODialog);
				this._bindItemDataToFragment(this._oComponent.getModel("_SD").getProperty("/SelectedItems"), this.oUpdateFODialog);
				this.oUpdateFODialog.open();
			}

			this.SuccessCallback = SuccessCallback;
			this.ErrorCallback = ErrorCallback;

		},
		onUpdateFreightOrderConfirmed: function () {
			//validation check - delivery date should be later than pickup date
			var oPickupDateDP = sap.ui.getCore().byId(this.updateFOId + "--idUFOConfimredPickupDate");
			var oPickupDate = oPickupDateDP.getDateValue();
			var oDeliveryDateDP = sap.ui.getCore().byId(this.updateFOId + "--idUFOConfimredDeliveryDate");
			var oDeliveryDate = oDeliveryDateDP.getDateValue();
			if (oPickupDate.getTime() > oDeliveryDate.getTime()) {
				MessageBox.error(this._oResourceBundle.getResourceBundle().getText("updateFODatesValidationText"));
				return;
			}
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");

			var oFOBase = this._fetchFOUpdateData(aFOs);
			if (!oFOBase) {
				return;
			}

			//var oFragmentContext = this.oUpdateFODialog.getBindingContext().getObject();

			for (var i = 0; i < aFOs.length; i++) {
				var oFO = jQuery.extend(true, {}, oFOBase);
				oFO.FreightOrder = aFOs[i].getProperty("FreightOrder");
				oFO.TransportationOrderUUID_F = aFOs[i].getProperty("TransportationOrderUUID_F");
				oFO.SrcLocationTimeZone = aFOs[i].getProperty("SrcLocationTimeZone");
				oFO.DesLocationTimeZone = aFOs[i].getProperty("DesLocationTimeZone");
				this.getModel().update(aFOs[i].getPath(), oFO, this.getStandardParameters(this.SuccessCallback, this.ErrorCallback));
			}
			this.onUpdateFreightOrderCancel();

		},

		onUpdateFreightOrderCancel: function () {
			this.oUpdateFODialog.close();
		},
		afterCloseUpdateFreightOrderDialog: function () {
			this.oUpdateFODialog.destroy();
			this.oUpdateFODialog = null;
		},
		_fetchFOUpdateData: function (aFOs) {

			var oFO = {};
			var oPickupDateDP = sap.ui.getCore().byId(this.updateFOId + "--idUFOConfimredPickupDate");
			var oPickupDate = oPickupDateDP.getDateValue();
			if (!oPickupDate && oPickupDateDP.getRequired()) {
				oPickupDateDP.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oPickupDateDP.setValueState(sap.ui.core.ValueState.None);
				oFO.SrcCarrierConfimedDate = this._convertDatetoString(oPickupDate);

				// this._convertBrowserTZToStopTZ(oPickupDate, aFOs[0].getProperty("SrcCarrierConfimedDateF"), aFOs[0].getProperty(
				// 	"SrcCarrierConfimedDate"));

			}

			var oDeliveryDateDP = sap.ui.getCore().byId(this.updateFOId + "--idUFOConfimredDeliveryDate");
			var oDeliveryDate = oDeliveryDateDP.getDateValue();
			if (!oDeliveryDate && oDeliveryDateDP.getRequired()) {
				oDeliveryDateDP.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oDeliveryDateDP.setValueState(sap.ui.core.ValueState.None);
				oFO.DesCarrierConfimedDate = this._convertDatetoString(oDeliveryDate);
				// this._convertBrowserTZToStopTZ(oDeliveryDate, aFOs[0].getProperty("DesCarrierConfimedDateF"), aFOs[0]
				// 	.getProperty("DesCarrierConfimedDate"));

			}

			return oFO;
		},

		_convertDatetoString: function (oDatePickerDate) {
			var sOldDate = oDatePickerDate.toLocaleString('en-US', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			});

			var aDateTime = sOldDate.split(",");
			var aDate = aDateTime[0].split("/");
			var aTime = aDateTime[1].trim().split(":");

			var sFullYear = aDate[2];
			var sMonth = aDate[0];
			var sDate = aDate[1];
			var sHour = aTime[0];
			var sMinute = aTime[1];
			var sSecond = aTime[2];

			var sFinalDate = sFullYear + sMonth + sDate + sHour + sMinute + sSecond;

			return sFinalDate;
		},

		/**
		 * convert a timestamp into JSON notation
		 * @param {String} oTimestamp: timestamp as string
		 * @returns {String} JSON Date
		 */
		convertTimestampToJSonDate: function (oTimestamp) {
			if (oTimestamp !== null) {
				if (oTimestamp !== "0") {
					var oTicks = Date.UTC(oTimestamp.substr(0, 4), // yyyy
						oTimestamp.substr(4, 2) - 1, // MM
						oTimestamp.substr(6, 2), // dd
						oTimestamp.substr(8, 2), // HH
						oTimestamp.substr(10, 2), // mm
						oTimestamp.substr(12, 2), // ss
						0);
					var oJSonDate = "/Date(" + oTicks + ")/";

					return oJSonDate;
				} else {
					return null;
				}
			} else {
				return null;
			}
		}

	});
});