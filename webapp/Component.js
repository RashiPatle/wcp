sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/AppCacheBuster",
	"sap/ui/Device",
	"./model/models",
	"com/westernacher/collaborationPortal/core/util/ErrorHandler",
	"sap/ui/model/json/JSONModel",
	"com/westernacher/collaborationPortal/core/util/MasterData",
	"com/westernacher/collaborationPortal/core/util/ActionHandler"
], function (UIComponent, AppCacheBuster, Device, models, ErrorHandler, JSONModel, MasterData, ActionHandler) {
	"use strict";

	return UIComponent.extend("com.westernacher.collaborationPortal.core.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this function, the device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// create the views based on the url/hash
			var oRouter = this.getRouter();
			//oRouter.register("coreRouter");
			oRouter.initialize();

			this._MD = new MasterData(this);
			this._AH = new ActionHandler(this, this._buttonsConfig);

			// Attach event for metadata failure
			this.displayMetadataFailedErrs();
		},

		/**
		 * Handles metadata failure errors
		 */
		displayMetadataFailedErrs: function () {
			var oModel = new sap.ui.model.odata.v2.ODataModel(this.getManifestEntry("sap.app").dataSources.mainService.uri);
			oModel.attachMetadataFailed(function (oError) {
				this._oErrorHandler._showServiceError(JSON.stringify(oError.getParameter("response")));
			}.bind(this));
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler is destroyed.
		 * @public
		 * @override
		 */
		destroy: function () {
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				// eslint-disable-next-line sap-no-proprietary-browser-api
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},
		_buttonsConfig: {
			acceptFOConfig: {
				entitySet: "ZWCP_C_Confirmation",
				restriction: "setComplete",
				propertyBinding: "V_ASetComplete"
			},
			rejectFOConfig: {
				entitySet: "ZWCP_C_Confirmation",
				restriction: "setCancelled",
				propertyBinding: "V_ASetCancelled"
			}
		},
		_buttonsEnableConfig: {
			acceptFOConfig: {
				propertyBinding: "/E_ASetComplete",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {
					// "GWConfStatus": ["!02", "!04"]
				},
				propertiesBinding: {
					// "GWConfStatus": "/Visible_FFoGwConfStat"
				}

			},
			rejectFOConfig: {
				propertyBinding: "/E_ASetCancelled",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {
					// "GWConfStatus": ["!04"]
				},
				propertiesBinding: {
					// "GWConfStatus": "/Visible_FFoGwConfStat"
				}
			}
		}

	});

});