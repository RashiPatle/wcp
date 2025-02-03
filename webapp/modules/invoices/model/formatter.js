sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */

		formatInvoiceStatusCode: function (sStausCode) {
			switch (sStausCode) {
			case "01":
				return "sap-icon://email";
			case "02":
				return "sap-icon://pending";
			case "03": 
				return "sap-icon://payment-approval";
			case "04":
				return "sap-icon://decline";
			case "05":
				return "sap-icon://cancel";
			}

			return "sap-icon://appear-offline";

		},
		formatInvoiceStatusCodeIconColor: function (sFOStatus) {
			if (sFOStatus) {
				return "Positive";
			}

			return "Negative";

		},
		formatDate: function (tDate) {
			var sDate = '';
			var oDate = new Date(tDate);
			if (oDate) {
				var localTime = oDate.getTime();
				var localOffset = oDate.getTimezoneOffset() * 60000;
				var oNewDate = new Date(localTime + localOffset);
				var sPatter;
				//if (sStatus !== "N") {
				sPatter = "dd.MM.YYYY HH:mm";
				//	} else {
				//		sPatter = "dd.MM.YYYY";
				//	}
				var oFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: sPatter
				});
				sDate = oFormat.format(oNewDate);
			}
			return sDate;
		},

	};

});