sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */

		formatQuotationResponse: function (sStausCode) {
			// if (! sStausCode) {
			// 	return 'sap-icon://document';
			// }
			// else {
			// 	return 'sap-icon://order-status';
			// }
			//open
			if (sStausCode === '02') {
				return 'sap-icon://document';
			} else {
				//close
				return 'sap-icon://order-status';
			}
		},
		formatQuotationResponseIconColor: function (sFOStatus) {
			if (!sFOStatus) {
				return 'Neutral';
			} else {
				return 'Positive';
			}
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