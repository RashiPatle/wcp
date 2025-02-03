sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"com/westernacher/collaborationPortal/core/model/formatter"
], function (UI5Object, MessageBox, formatter) {
	"use strict";

	return UI5Object.extend("com.westernacher.collaborationPortal.core.util.ErrorHandler", {
		formatter: formatter,
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				//	this._showServiceError(oParams.response);
				this.callMultipleErrorDialog(null, oEvent);
			}, this);

			this._oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
						"Cannot POST") === 0)) {
					//	this._showServiceError(oParams.response);
					this.callMultipleErrorDialog(null, oEvent);
				}
			}, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			MessageBox.error(
				this._sErrorText, {
					id: "serviceErrorMessageBox",
					details: sDetails,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},
		callMultipleErrorDialog: function (oResponse, sSucessMessageToast, sUserMessage) {
			var aMultipleWarnings = this._prepareMultipleWarnings(oResponse);
			var aMultipleErrors = this._prepareMultipleErrors(oResponse);
			var aSingleWarning = this._prepareSingleWarning(oResponse);
			var aSingleError = this._prepareSingleError(oResponse);
			var aUserWarning = [];
			if (sUserMessage) {
				if (typeof (sUserMessage) === "object") {
					aUserWarning.push(sUserMessage);
				} else {
					aUserWarning.push({
						message: sUserMessage
					});
				}
			}
			var oMergedErrorMessages = aMultipleWarnings.concat(aMultipleErrors, aSingleWarning, aSingleError, aUserWarning);
			if (oMergedErrorMessages.length > 0) {
				var oMergedErrorsModel = {
					errordetails: jQuery.extend(true, {}, oMergedErrorMessages)
				};

				this._openErrorsDialog(oMergedErrorsModel);
			}
			if (sSucessMessageToast) {
				this._openMessageToast(sSucessMessageToast);
			}
			return oMergedErrorMessages;
		},
		_prepareMultipleWarnings: function (oResponse) {
			var aWarningMessages = [];
			if (oResponse) {
				var oError;
				if (oResponse.headers && oResponse.headers["sap-message"]) {
					try {
						oError = JSON.parse(oResponse.headers["sap-message"]);
					} catch (e) {
						return [];
					}

				} else if (typeof oResponse.getParameter === "function" && oResponse.getParameter('headers') && oResponse.getParameter('headers')[
						"sap-message"]) {
					try {
						oError = JSON.parse(oResponse.getParameter('headers')["sap-message"]);
					} catch (e) {
						return [];
					}

				}

				if (oError && oError.message) {
					var aWarningDetails = [];
					if (oError.details && oError.details.length > 0) {
						aWarningDetails = oError.details;
						delete oError.details;
					}
					aWarningMessages = [oError].concat(aWarningDetails);
				}
			}
			return aWarningMessages;
		},
		_prepareMultipleErrors: function (oResponse) {
			var aMultipleErrors = [];
			if (oResponse && oResponse.error) {
				aMultipleErrors = this._prepareSystemError(oResponse);
				if (oResponse.error.message && typeof oResponse.error.message === "string") {
					aMultipleErrors.push({
						message: oResponse.error.message
					});
				}
			}

			return aMultipleErrors;
		},
		_prepareSingleWarning: function (oResponse) {
			var aSingleError = [];

			if (oResponse) {
				var oRawErrorMessage;
				if (oResponse.responseRaw) {
					try {
						oRawErrorMessage = JSON.parse(oResponse.responseRaw);
					} catch (e) {
						return [];
					}

				} else if (typeof oResponse.getParameter === "function" && oResponse.getParameter('responseRaw')) {
					try {
						oRawErrorMessage = JSON.parse(oResponse.getParameter('responseRaw'));
					} catch (e) {
						return [];
					}
				}
				if (oRawErrorMessage) {
					aSingleError = this._prepareSystemError(oRawErrorMessage);
				}

			}
			return aSingleError;
		},
		_prepareSingleError: function (oResponse) {
			var aSingleError = [];

			if (oResponse) {
				var oRawErrorMessage;
				if (oResponse.response && oResponse.response.body) {
					try {
						oRawErrorMessage = JSON.parse(oResponse.response.body);
					} catch (e) {
						return [];
					}
				} else if (typeof oResponse.getParameter === "function" && oResponse.getParameter('response')) {
					var oResponsetext = oResponse.getParameter('response').responseText;
					if (oResponsetext) {
						try {
							oRawErrorMessage = JSON.parse(oResponsetext);
						} catch (e) {
							return [];
						}

					}

				} else if (oResponse.responseText) {
					var oResponseText = oResponse.responseText;
					try {
						oRawErrorMessage = JSON.parse(oResponseText);
					} catch (e) {
						//Setting response text to message in case the response text is in xml format
						return {
							message: oResponseText
						};
					}
				}
				//var oRawErrorMessage = JSON.parse(oResponse.getParameter("responseRaw"));
				if (oRawErrorMessage) {
					aSingleError = this._prepareSystemError(oRawErrorMessage);
				}

			}
			return aSingleError;
		},
		_prepareSystemError: function (oRawErrorMessage) {
			var aSystemErrors = [];
			if (oRawErrorMessage && oRawErrorMessage.error) {
				var oError = oRawErrorMessage.error;
				if (oError.innererror && oError.innererror.errordetails && oError.innererror.errordetails.length > 0) {
					if (!this.oErrorTable) {
						for (var i = 0; i < oError.innererror.errordetails.length; i++) {
							if (!oError.innererror.errordetails[i].message) {
								oError.innererror.errordetails.splice(i, 1);
							}
						}
						aSystemErrors = oError.innererror.errordetails;
					}
				} else if (oError.message && oError.message.value) {
					aSystemErrors.push({
						message: oError.message.value
					});
				}
			}
			return aSystemErrors;
		},
		_openMessageToast: function (sSuccessMessageToast) {
			sap.m.MessageToast.show(sSuccessMessageToast);
		},

		_openErrorsDialog: function (oMessages) {
			if (!this.oErrorTable) {
				var oModel = new sap.ui.model.json.JSONModel(oMessages); //this.getView().getModel();
				var oFragment = sap.ui.xmlfragment("com.westernacher.collaborationPortal.core.fragment.multipleErrorsDialog", this);
				this.oErrorTable = oFragment;
				this.oErrorTable.setModel(oModel, "errorModel");
				this.oErrorTable.setModel(this._oComponent.getModel("i18n"), "i18n");
				this.oErrorTable.open();
			}
		},
		_initialiseErrorsDialog: function () {
			if (!this.oErrorTable) {
				var oFragment = sap.ui.xmlfragment("com.westernacher.collaborationPortal.core.fragment.multipleErrorsDialog", this);
				this.oErrorTable = oFragment;
			}
		},
		_afterClose: function () {
			if (this.oErrorTable) {
				if (this.oErrorTable.isOpen()) {
					this.oErrorTable.close();
				}
				this.oErrorTable.destroy();
			}
			this.oErrorTable = null;
		},
		onClosePage: function () {
			this.oErrorTable.close();
		}
	});
});