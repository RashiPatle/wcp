sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */

		formatFreightOrderStatusIcon: function (sStausCode) {
			switch (sStausCode) {
			case '03':
				//In Execution 
				return 'sap-icon://shipping-status';
				break;
			case '04':
				//Executed
				return 'sap-icon://complete';
				break;

			default:
				//None of above
				return 'sap-icon://appear-offline';
				break;
			}
		},
		formatFreightOrderStatusIconColor: function (sFOStatus) {
			switch (sFOStatus) {

			case '03':
				return 'Neutral';
				break;
			case '04':
				return 'Positive';
				break;
			default:
				return 'Neutral';
				break;
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
				sPatter = "YYYY.MM.dd HH:mm";
				//	} else {
				//		sPatter = "dd.MM.YYYY";
				//	}
				var oFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: sPatter
				});
				sDate = oFormat.format(oNewDate);
			}
			return sDate;
		}

	};

});