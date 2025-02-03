sap.ui.define([
	"sap/ui/core/UIComponent",
	"com/westernacher/collaborationPortal/core/util/ActionHandler",
	"com/westernacher/collaborationPortal/core/util/ButtonsEnableHandler",
	"com/westernacher/collaborationPortal/core/util/MasterData",
	"com/westernacher/collaborationPortal/core/util/AttachmentSectionHandler",
	"com/westernacher/collaborationPortal/core/util/CargoItemSectionHandler",
	"com/westernacher/collaborationPortal/core/util/ResourceSectionHandler",
	"com/westernacher/collaborationPortal/core/util/EventSectionHandler",
	"com/westernacher/collaborationPortal/core/util/FreightOrderModuleHandler",
	"com/westernacher/collaborationPortal/core/util/StopSectionHandler",
	"com/westernacher/collaborationPortal/core/util/ErrorHandler",
	"com/westernacher/collaborationPortal/core/util/CargoItemExecutionSectionHandler",
	"com/westernacher/collaborationPortal/core/util/FreightUnitModuleHandler",
	"com/westernacher/collaborationPortal/core/util/FreightBookingModuleHandler",
	"com/westernacher/collaborationPortal/core/util/ContainerSectionHandler"
], function (UIComponent, ActionHandler, ButtonsEnableHandler, MasterData, AttachmentSectionHandler, CargoItemSectionHandler,
	ResourceSectionHandler, EventSectionHandler, FreightOrderModuleHandler, StopSectionHandler, ErrorHandler,
	CargoItemExecutionSectionHandler, FreightUnitModuleHandler, FreightBookingModuleHandler, ContainerSectionHandler) {
	"use strict";

	return UIComponent.extend("com.westernacher.collaborationPortal.core.util.ComponentParent", {
		initializeUtilHandlers: function () {
			var oConfig = this._utilHandlersConfig;
			if (!oConfig) {
				return;
			}

			var aRequiredHandlers = oConfig.requiredHandlers;
			for (var i = 0; i < aRequiredHandlers.length; i++) {
				var sHandler = aRequiredHandlers[i];
				this._MD = new MasterData(this);

				if (this._buttonsConfig) {
					this._AH = new ActionHandler(this, this._buttonsConfig);
				}
				if (this._buttonsEnableConfig) {
					this._BEH = new ButtonsEnableHandler(this, this._buttonsEnableConfig);
				}

				if (sHandler === "_AttachH" && oConfig.attachmentsEntitySet) {
					this._AttachH = new AttachmentSectionHandler(this, oConfig.sSlugPropertyName, oConfig.attachmentsEntitySet, oConfig.attachmentsTypeVisibility,
						oConfig.attachmentsTypeEntitySet);
				}
				if (sHandler === "_CargoItemH" && oConfig.mainEntitySet) {
					this._CargoItemH = new CargoItemSectionHandler(this, oConfig.mainEntitySet);
				}
				//New Added for execution Cargo items tree
				if (sHandler === "_CargoItemHExecution" && oConfig.mainEntitySet) {
					this._CargoItemHExecution = new CargoItemExecutionSectionHandler(this, oConfig.mainEntitySet);
				}
				if (sHandler === "_ResourceH" && oConfig.mainEntitySet) {
					this._ResourceH = new ResourceSectionHandler(this, oConfig.mainEntitySet);
				}
				if (sHandler === "_EventH" && oConfig.mainEntitySet) {
					this._EventH = new EventSectionHandler(this, oConfig.eventsTypeEntitySet);
					this.assignEventsCodeoDataModel();
					this.assignEventsReasonCodeoDataModel();
				}
				if (sHandler === "_FOH") {
					this._FOH = new FreightOrderModuleHandler(this, oConfig.idUpdateFODialog);
				}
				if (sHandler === "_oErrorHandler") {
					this._oErrorHandler = new ErrorHandler(this);
				}
				if (sHandler === "_StopH") {
					this._StopH = new StopSectionHandler(this, oConfig.sItemsPropertyName);
				}
				//New Added for Freight Unit Module
				if (sHandler === "_FUH") {
					this._FUH = new FreightUnitModuleHandler(this, oConfig.idUpdateFUDialog);
				}
				//New Added for Freight Booking Module
				if (sHandler === "_FBH") {
					this._FBH = new FreightBookingModuleHandler(this, oConfig.idUpdateFBDialog, oConfig.mainEntitySet);
				}
				if (sHandler === "_ContainerH" && oConfig.mainEntitySet) {
					this._ContainerH = new ContainerSectionHandler(this, oConfig.mainEntitySet);
				}
			}

		},

		destoryUtilHandlers: function () {
			if (this._AH) {
				this._AH.destroy();
			}
			if (this._BEH) {
				this._BEH.destroy();
			}
			if (this._MD) {
				this._MD.destroy();
			}
			if (this._AttachH) {
				this._AttachH.destroy();
			}
			if (this._CargoItemH) {
				this._CargoItemH.destroy();
			}
			//Newly added for Cargo items tree table in execution 
			if (this._CargoItemHExecution) {
				this._CargoItemHExecution.destroy();
			}
			if (this._ResourceH) {
				this._ResourceH.destroy();
			}
			if (this._FOH) {
				this._FOH.destroy();
			}
			if (this._oErrorHandler) {
				this._oErrorHandler.destroy();
			}
			if (this._StopH) {
				this._StopH.destroy();
			}
			if (this._FUH) {
				this._FUH.destroy();
			}
			if (this._FBH) {
				this._FBH.destroy();
			}
			if (this._ContainerH) {
				this._ContainerH.destroy();
			}

		},
		assignEventsCodeoDataModel: function () {

			// "": {
			// 	"uri": "/sap/opu/odata/sap/ZWCP_C_FOEVENTS_CDS",
			// 	"type": "sap.ui.model.odata.v2.ODataModel",
			// 	"settings": {
			// 		"odataVersion": "2.0",
			// 		"defaultOperationMode": "Server",
			// 		"defaultBindingMode": "OneWay",
			// 		"defaultCountMode": "Request"
			// 	}
			// },
			this.setModel(this._initializeODataModel("/sap/opu/odata/sap/ZWCP_C_FOEVENTS_CDS"), "_EventsCode");
		},
		assignEventsReasonCodeoDataModel: function () {
			// "": {
			// 	"uri": "/sap/opu/odata/sap/ZWCP_C_REASONBYEVENT_CDS",
			// 	"type": "sap.ui.model.odata.v2.ODataModel",
			// 	"settings": {
			// 		"odataVersion": "2.0",
			// 		"defaultOperationMode": "Server",
			// 		"defaultBindingMode": "OneWay",
			// 		"defaultCountMode": "Request"
			// 	}
			// }
			this.setModel(this._initializeODataModel("/sap/opu/odata/sap/ZWCP_C_REASONBYEVENT_CDS"), "_EventsReasonCode");
		},
		_initializeODataModel: function (sUri) {
			var oConfig = {
				"odataVersion": "2.0",
				"defaultOperationMode": "Server",
				"defaultBindingMode": "OneWay",
				"defaultCountMode": "Request"
			};

			var oModel = new sap.ui.model.odata.v2.ODataModel(sUri, oConfig);
			return oModel;
		}
	});
});