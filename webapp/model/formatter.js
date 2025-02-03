sap.ui.define([
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/Locale",
	"sap/ui/core/LocaleData"
], function (NumberFormat, Locale, LocaleData) {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		customNumberUnit: function (sNumber, sUnit) {
			if (!sNumber || !sUnit) {
				return "";
			} else {
				var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance();

				return oCurrencyFormat.format(sNumber, sUnit);
			}
		},

		//Return only number after formatting
		customNumberUnitOnlyNumber: function (sNumber, sUnit) {
			if (!sNumber) {
				return "";
			} else {
				var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
					showMeasure: false
				});

				return oCurrencyFormat.format(sNumber, sUnit);
			}
		},

		//Return only number after formatting unit for distance (KM/MI)
		//By default, sNumber is for KM and sUnit is KM.
		customUnitForDistanceOnlyNumber: function (sNumber, sUnit) {
			if (!sNumber) {
				return "";
			} else {
				var sUserUnit;
				if (this._oComponent) {
					sUserUnit = this._oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultUnitForDistSet");
				} else {
					sUserUnit = this.oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultUnitForDistSet");
				}

				if (sUserUnit === "MI") {
					sNumber = sNumber / 1.6093;
				}

				var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
					showMeasure: false
				});

				return oCurrencyFormat.format(sNumber, sUnit);
			}
		},

		//Return Unit for distance (KM/MI)
		//By default, sUnit is KM.
		customUnitForDistanceOnlyUnit: function (sUnit) {
			if (!sUnit) {
				return "";
			} else {
				var sUserUnit;
				if (this._oComponent) {
					sUserUnit = this._oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultUnitForDistSet");
				} else {
					sUserUnit = this.oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultUnitForDistSet");
				}

				if (sUserUnit === "MI") {
					sUnit = "MI";
				}

				return sUnit;
			}
		},

		customUnitFormat: function (sNumber, sUnit) {
			if (!sNumber || !sUnit) {
				return "";
			} else {
				var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance();
				return oCurrencyFormat.format(sNumber, sUnit);
			}
		},
		customCurrencyParser: function (sValue) {
			if (!sValue) {
				return "";
			} else {
				var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
					currencyCode: false
				});
				return "" + oCurrencyFormat.parse(sValue)[0];
			}
		},
		onFormatModuleIcons: function (sIcon) {
			switch (sIcon) {
			case "EXECUTION":
				return "sap-icon://validate";
				break;
			case "QUOTE":
				return "sap-icon://travel-itinerary";
				break;
			case "INVOICE":
				return "sap-icon://monitor-payments";
				break;
			case "DISPUTE":
				return "sap-icon://decision";
				break;
			default:
				return "sap-icon://appear-offline";
				break;
			}
		},

		formatDate: function (oDate) {
			var sDate = '';
			if (oDate) {
				var localTime = oDate.getTime();
				var localOffset = oDate.getTimezoneOffset() * 60000;
				var oNewDate = new Date(localTime + localOffset);
				var sPatter = "YYYY-MM-dd HH:mm";

				var oFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: sPatter
				});
				sDate = oFormat.format(oNewDate);
			}
			return sDate;
		},

		onDateWithOffset: function (oDate) {
			if (oDate) {
				var localTime = oDate.getTime();
				var localOffset = oDate.getTimezoneOffset() * 60000;
				var oNewDate = new Date(localTime + localOffset);
				return oNewDate;
			}
		},
		onRemoveOffset: function (oDate) {
			if (oDate) {
				var localTime = oDate.getTime();
				var localOffset = oDate.getTimezoneOffset() * 60000;
				var oNewDate = new Date(localTime - localOffset);
				return oNewDate;
			}
		},
		formatTransportationModeIcon: function (sTrMode) {
			switch (sTrMode) {
			case 'Road':
				return 'sap-icon://shipping-status';
				break;
			case 'Rail':
				return 'sap-icon://cargo-train';
				break;
			case 'Sea':
				return 'sap-icon://blur';
				break;
			case 'Air':
				return 'sap-icon://flight';
				break;
			default:
				return 'sap-icon://cargo-train';
				break;
			}
		},
		formatTransportationStatusIcon: function (sFOStatus) {
			switch (sFOStatus) {
			case '01':
				return 'sap-icon://accept';
				break;
			case '02':
				return 'sap-icon://decline';
				break;
			case '03':
				return 'sap-icon://validate';
				break;
			default:
				return 'sap-icon://validate';
				break;
			}
		},
		formatTransportationExecStatusIcon: function (sFOStatus) {
			switch (sFOStatus) {
			case '01':
				//Open 
				return 'sap-icon://shipping-status';
				break;
			case '02':
				//Closed
				return 'sap-icon://accept';
				break;
			case '03':
				//Canceled
				return 'sap-icon://inspect-down';
				break;
			}
		},
		formatSelfBillingStatusIcon: function (sStausCode) {
			switch (sStausCode) {
			case '01':
				return 'sap-icon://accept';
				break;
			case '02':
				return 'sap-icon://pending';
				break;
			case '03':
				return 'sap-icon://validate';
				break;
			default:
				return 'sap-icon://validate';
				break;
			}
		},
		formatSelfBillingStatusColor: function (sStausCode) {
			switch (sStausCode) {
			case '01':
				return "#3CB371";
				break;
			case '02':
				return "#87CEEB";

				break;
			case '03':
				return "#FFA500";
				break;
			default:
				break;

			}
		},
		formatTransportationExecStatusIconColor: function (sStausCode) {
			switch (sStausCode) {
			case '01':
				return "#87CEEB";
				break;
			case '02':
				return "#3CB371";
				break;
			case '03':
				return "#FFA500";
				break;
			case '04':
				return "#FA8072";
				break;
			default:
				break;

			}
		},
		formatTransportationModeStatusColor: function (sFOStatus) {
			switch (sFOStatus) {
			case '01':
				return 'Positive';
				break;
			case '02':
				return 'Negative';
				break;
			case '03':
				return 'Neutral';
				break;
			default:
				return 'Neutral';
				break;
			}
		},
		formatQuotationStatusIcon: function (sFOStatus) {
			switch (sFOStatus) {
			case '01':
				//Open 
				return 'sap-icon://employee-approvals';
				break;
			case '02':
				//Closed
				return 'sap-icon://employee-rejections';
				break;
			case '03':
				//Canceled
				return '';
				break;
			}
		},
		formatQuotationStatusIconColor: function (sFOStatus) {
			switch (sFOStatus) {
			case '01':
				return 'Positive';
				break;
			case '02':
				return 'Negative';
				break;
			default:
				return '';
				break;
			}
		},
		onFormatNumber: function (dNumber) {
			if (dNumber) {
				return parseFloat(dNumber).toFixed(2);
			}
			return "0.00";
		},

		onFormatQuantity: function (dNumber) {
			if (dNumber) {
				return parseInt(dNumber);
			}
			return "0";
		},

		onDGFormat: function (bDG) {
			if (bDG) {
				return "Yes";
			} else {
				return "No";
			}
			return bDG;
		},
		formatDateTimeOffset: function (iDate) {
			if (!iDate) {
				return "";
			}
			var oDate = new Date(iDate);
			if (oDate) {
				var localTime = oDate.getTime();
				var localOffset = oDate.getTimezoneOffset() * 60000;
				var oNewDate = new Date(localTime + localOffset);
				var oFormat = sap.ui.core.format.DateFormat.getInstance({
					pattern: "yyyy-MM-dd HH:mm"
				});
				return oFormat.format(oNewDate);
			}
			return "";
		},
		formatDateOffset: function (iDate) {
			if (!iDate) {
				return "";
			}
			var oDate = new Date(iDate);
			if (oDate) {
				var localTime = oDate.getTime();
				var localOffset = oDate.getTimezoneOffset() * 60000;
				var oNewDate = new Date(localTime + localOffset);
				var oFormat = sap.ui.core.format.DateFormat.getInstance({
					pattern: "yyyy-MM-dd"
				});
				return oFormat.format(oNewDate);
			}
			return "";
		},
		displayEventDateBaseOnStatus: function (sStatus, dActualDate, dExpectedDate) {
			if (sStatus === "N" || sStatus === "R") {
				return dActualDate;
			} else {
				return dExpectedDate;
			}

		},
		EventsDateTime: function (sStatus) {
			if (sStatus === "N") {
				return '{_SD>ActualDateTime}';
			} else {
				return '{_SD>ExpectedDateTime}';
			}
		},

		EventsReportVisible: function (sStatus) {
			if (sStatus === "E") {
				return true;
			}
			return false;
		},

		EventsReportIcon: function (sStatus) {
			if (sStatus === "R") {
				return "sap-icon://notification-2";
			}
			if (sStatus === "N") {
				return "sap-icon://message-popup";
			}
			return "sap-icon://post";
		},
		EventsReportStatus: function (sStatus) {
			if (sStatus === "R") {
				return "Success";
			}
			if (sStatus === "N") {
				return "Warning";
			}
			return "Information";
		},
		QuotationStatus: function (sStatus) {
			if (sStatus === "RE") {
				return "Error";
			}
			if (sStatus === "EP") {
				return "Warning";
			}
			if (sStatus === "PE") {
				return "Information";
			}
			if (sStatus === "AW") {
				return "Success";
			}
		},
		AppointmentStatusIcon: function (sStatus) {
			if (sStatus === "New") {
				return "sap-icon://check-availability";
			}
			if (sStatus === "Planned") {
				return "sap-icon://appointment";
			}
			return "sap-icon://sys-help";
		},
		onScenarioIdFormat: function (sValue) {
			if (this.i18n) {
				return this.i18n.getProperty(sValue);
			} else {
				return sValue;
			}
		},
		formatInvoicesStatusIcon: function (sStausCode) {
			switch (sStausCode) {
			case '01':
				//Open 
				return 'sap-icon://accept';
				break;
			case '02':
				//Closed
				return 'sap-icon://decline';
				break;
			case '03':
				//Canceled
				return 'sap-icon://pending';
				break;
			case '04':
				//Canceled
				return 'sap-icon://email-read';
				break;
			}
		},
		formatInvoicesStatusColor: function (sFOStatus) {
			switch (sFOStatus) {
			case '01':
				return 'Positive';
				break;
			case '02':
				return 'Negative';
				break;
			case '03':
				return 'Neutral';
				break;
			case '04':
				return 'Neutral';
				break;
			default:
				return 'Neutral';
				break;
			}
		},
		formatDisputeStatusIcon: function (sStausCode) {
			switch (sStausCode) {
			case '01':
				//Open 
				return 'sap-icon://decision';
				break;
			case '02':
				//Closed
				return 'sap-icon://travel-request';
				break;

			}
		},
		formatDisputeStatusColor: function (sFOStatus) {
			switch (sFOStatus) {
			case '01':
				return 'Positive';
				break;
			case '02':
				return 'Negative';
				break;
			default:
				return 'Neutral';
				break;
			}
		},

		removePrefix: function (prefix, s) {
			return s.substr(prefix.length);
		},
		fProperties: function (bPropertyValue) {
			if (bPropertyValue) {
				return true;
			} else {
				return false;
			}
		},
		formatStages: function (src, dest, event) {
			if (src && dest) {
				return src + ' - ' + dest;
			} else {
				return event;
			}
		},
		formatEventIcon: function (event) {
			if (event == 'Loading') {
				return 'sap-icon://status-inactive';
			} else if (event == 'Unloading') {
				return 'sap-icon://rhombus-milestone-2';
			} else {
				return;
			}

		},
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
			case '07':
				return 'sap-icon://inventory';
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
			case '07':
				return 'Neutral';
				break;
			default:
				return 'Neutral';
				break;
			}
		},

		formatNonStackableIcon: function (bNonStackable) {
			if (!bNonStackable) {
				return 'sap-icon://upstacked-chart';
			} else {
				return 'sap-icon://sys-cancel';
			}
		},

		formatNonStackableIconColor: function (bNonStackable) {
			if (!bNonStackable) {
				return 'Accept';
			} else {
				return 'Neutral';
			}
		},

		formatDGVisibility: function (sDGStatus) {
			if (sDGStatus === "Yes") {
				return true;
			} else {
				return false;
			}
		},

		formatDGIcon: function (bTranspOrdItemIsDangerousGood) {
			if (bTranspOrdItemIsDangerousGood) {
				return 'sap-icon://block';
			} else {
				return 'sap-icon://cancel';
			}
		},

		formatDGIconColor: function (sDGStatus) {
			if (sDGStatus) {
				return 'Negative';
			} else {
				return 'Neutral';
			}
		},
		/*
		 * New Formatting for dangerous goods
		 */
		formatDGCustomIcon: function (bTranspOrdItemIsDangerousGood) {
			if (bTranspOrdItemIsDangerousGood == true) { //Dangerous goods icon to be displayed only when true
				return "sap-icon://warning2";
			}
		},

		formatDGStatusIcon: function (sDGStatus) {
			if (sDGStatus === "Yes") {
				return 'Warning';
			} else {
				return 'None';
			}
		},

		/** 
		 * Returns yesterday, today names based on given date
		 * @param {object} [oUTCDate] Date in UTC
		 * @returns {string} 
		 */
		getDateBeforeOrAfterDays: function (oUTCDate) {
			var oFormatOptions = {
				day: "2-digit",
				month: "2-digit",
				year: "2-digit"
			};

			var oGivenDate = new Date(oUTCDate).toLocaleString(sap.ui.getCore().getConfiguration().getLanguage(), oFormatOptions);

			// Today's locale date
			var oTodaysDate = new Date().toLocaleString(sap.ui.getCore().getConfiguration().getLanguage(), oFormatOptions);

			// Yesterday's locale date
			var oYesterdaysDate = new Date();
			oYesterdaysDate.setDate(oYesterdaysDate.getDate() - 1);
			oYesterdaysDate = oYesterdaysDate.toLocaleString(sap.ui.getCore().getConfiguration().getLanguage(), oFormatOptions);

			// Method to get locale time by date
			var fnGetLocaleTimeFromDate = function () {
				var oTimeInstance = sap.ui.core.format.DateFormat.getTimeInstance();
				return sap.ui.core.format.DateFormat.getInstance({
					pattern: oTimeInstance.aFallbackFormats[0].oFormatOptions.pattern
				}).format(oUTCDate);
			};

			if (oGivenDate === oTodaysDate) {
				return this.i18n.getResourceBundle().getText("Today") + " " + fnGetLocaleTimeFromDate();
			} else if (oGivenDate === oYesterdaysDate) {
				return this.i18n.getResourceBundle().getText("Yesterday") + " " + fnGetLocaleTimeFromDate();
			} else {
				return new Date(oGivenDate);
			}

		},

		/**
		 * Find locale decimla or group charater 
		 * @returns locale decimal/ group character
		 */
		_findCharacterFromNumberFormat: function (sCharacterType) {
			// Gets locale code Ex: 'en_US'
			var sLocaleString = "pl"; //sap.ui.getCore().getConfiguration().getLocale().toString();

			if (!sap.ui.Device.browser.chrome && (sap.ui.Device.browser.msie || sap.ui.Device.browser.internet_explorer)) {
				// In case of IE
				if (sCharacterType === "group") {
					// value 1000.1 is dummy number to get locale decimal & group character
					return 1000.1.toLocaleString(sLocaleString).replace(/\d/g, '')[0];
				} else if (sCharacterType === "decimal") {
					return 1000.1.toLocaleString(sLocaleString).replace(/\d/g, '')[1];
				}
			} else {
				// Gets locale group and decimal characters based with dummy numeric
				var oNumberFormat = Intl.NumberFormat(sLocaleString).formatToParts(1000.1);
				var aCharArray = oNumberFormat.filter(function (a) {
					return a.type === sCharacterType ? a.value : undefined;
				}.bind(this));

				return aCharArray.length > 0 ? aCharArray[0].value : undefined;
			}

		},

		/** 
		 * Validates the amount in locale
		 * @param {sap.ui.base.Event} [oControlEvent] oSource and oParameters of the input control
		 * 
		 */
		validatePriceInLocale: function (oControlEvent) {
			var oParams = oControlEvent.getParameters(),
				oSource = oControlEvent.getSource();
			if (this._bIsLastPriceChangedToLocale) {
				// If statement, Once the last price converted to locale if user re-enters decimal or group separator then resets the value
				if (oParams.value[oParams.value.length - 1] === this._sLocaleGroupChar || oParams.value[oParams.value.length - 1] === this._sLocaleDecimalChar) {
					oSource.setValue("");
				} else {
					oSource.setValue(oParams.value[oParams.value.length - 1]);
				}
				this._bIsLastPriceChangedToLocale = false;
			}
			var sLocaleDecimalChar = this._findCharacterFromNumberFormat("decimal"),
				sLocaleGroupChar = this._findCharacterFromNumberFormat("group");
			// Locale group and decimal characters into local reference
			this._sLocaleGroupChar = sLocaleGroupChar;
			this._sLocaleDecimalChar = sLocaleDecimalChar;

			// In case of group or decimal character is dot(.) then adding '\' to make correct regular expression
			sLocaleGroupChar = sLocaleGroupChar === "." ? "\\." : sLocaleGroupChar;
			sLocaleDecimalChar = sLocaleDecimalChar === "." ? "\\." : sLocaleDecimalChar;
			this._oCustomRegex = new RegExp("^[-+]?(?:[0-9]+" + sLocaleGroupChar + ")*[0-9]+(?:" + sLocaleDecimalChar + "[0-9]+)?$");

			if (oSource.getValue()) {
				// Allows user to enter locale group and decimal character
				if (oParams.value[oParams.value.length - 1] === this._sLocaleGroupChar || oParams.value[oParams.value.length - 1] === this._sLocaleDecimalChar) {
					return;
				} else {
					// Validates input value and resets the value if it's not first time and not valid
					if (!this._oCustomRegex.test(oParams.value)) {
						oSource.setValue("");
					}
				}
			} else {
				// Validates input value at first time and resets the value if it's not valid
				if (!this._oCustomRegex.test(oParams.value)) {
					oSource.setValue("");
				}
			}
		},
		/** 
		 * Converts the amount in locale
		 * @param {sap.ui.base.Event} [oControlEvent] oSource and oParameters of the input control
		 * 
		 */
		convertPriceInLocaleFormat: function (oControlEvent) {
			var oSource = oControlEvent.getSource(),
				sValue = (oSource.getValue()).replace(/[a-z]/gi, ''),
				sParsedValue = "";

			if (sValue.trim().length > 0 && sValue.trim().length < 12) {
				var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance();
				sParsedValue = oCurrencyFormat.parse(sValue);
				if (sParsedValue) {
					oSource.setValue(oCurrencyFormat.format(sParsedValue[0], ""));
				} else {
					oSource.setValue("");
				}
			} else {
				oSource.setValue("");
			}
		},
		/** 
		 * Converts the amount in locale ------Old
		 * @param {sap.ui.base.Event} [oControlEvent] oSource and oParameters of the input control
		 * 
		 */
		convertPriceInLocale: function (oControlEvent) {
			var oSource = oControlEvent.getSource();
			this._bIsLastPriceChangedToLocale = true;
			// Resets value if the value is not valid on control focus-out 
			if (!this._oCustomRegex.test(oSource.getValue())) {
				oSource.setValue("");
			}
			var aEnteredPrice = parseFloat(this.removeDecimalGrpCharacterFromPrice(oSource.getValue()));
			// Converting two digit decimal number locale
			aEnteredPrice = aEnteredPrice.toLocaleString(sap.ui.getCore().getConfiguration().getLanguage(), {
				maximumFractionDigits: 2,
				minimumFractionDigits: 2
			});

			aEnteredPrice = aEnteredPrice.toString().split(this._sLocaleDecimalChar);
			// Finds the element which has empty in the list and removes it
			for (var i = 0; i < aEnteredPrice.length; i++) {
				if (!aEnteredPrice[i]) {
					aEnteredPrice.splice(i, 1);
				}
			}

			// Removes group character from the string to make proper grouping
			var aPriceDigits = aEnteredPrice[0].split(this._sLocaleGroupChar),
				sPrice = "";
			for (var j = 0; j < aPriceDigits.length; j++) {
				sPrice = sPrice + aPriceDigits[j];
			}
			// Replace price value 
			aEnteredPrice.splice(0, 1, sPrice);
			// Sets locale group character at every 3-digits
			aEnteredPrice[0] = aEnteredPrice[0].replace(/\B(?=(\d{3})+(?!\d))/g, this._sLocaleGroupChar);
			// Sets locale price to input control
			oSource.setValue(aEnteredPrice.join(this._sLocaleDecimalChar));
		},

		/**
		 * Removes decimal group character from given price
		 * @return
		 */
		removeDecimalGrpCharacterFromPrice: function (sValue) {
			if (!sValue) {
				return;
			}
			var sLocaleDecimalChar = this._findCharacterFromNumberFormat("decimal"),
				sLocaleGroupChar = this._findCharacterFromNumberFormat("group");
			var aEnteredPrice = sValue.toString().split(sLocaleDecimalChar);
			var aPriceDigits = aEnteredPrice[0].split(sLocaleGroupChar),
				sPrice = "";
			for (var j = 0; j < aPriceDigits.length; j++) {
				sPrice = sPrice + aPriceDigits[j];
			}
			// Replace price value 
			aEnteredPrice.splice(0, 1, sPrice);
			return aEnteredPrice.join(sLocaleDecimalChar);
		},

		checkPriceUnitValue: function (sPriceUnit) {
			if (parseFloat(sPriceUnit) > 0) {
				return 'per';
			} else {
				return '';
			}
		},

		toUTCDate: function (oDate) {
			var oUTCDate = new Date(oDate.getUTCFullYear(), oDate.getUTCMonth(), oDate.getUTCDate(),
				oDate.getUTCHours(), oDate.getUTCMinutes(), oDate.getUTCSeconds());
			return (oUTCDate);
		},

		toUserSettingTimezoneDate: function (oDate) {
			if (!oDate) {
				return "";
			}

			var sTimezone;
			if (this._oComponent) {
				sTimezone = this._oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultTimeZoneSet");
			} else {
				sTimezone = this.oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultTimeZoneSet");
			}

			var DateTimeOptions = {
				timeZone: sTimezone,
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				hour12: true
			};

			// var oUTCDate = new Date(Date.UTC(oDate.getUTCFullYear(), oDate.getUTCMonth(), oDate.getUTCDate(),
			// 	oDate.getUTCHours(), oDate.getUTCMinutes(), oDate.getUTCSeconds()));
				
			var sTimezoneDate = oDate.toLocaleString("en-US", DateTimeOptions) + " " + sTimezone;

			return sTimezoneDate;
		}

	};

});