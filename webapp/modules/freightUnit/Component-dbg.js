sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ComponentParent",
	"com/westernacher/collaborationPortal/freightUnit/util/freightUnitHandler",
	"sap/ui/Device",
	"./model/models"
], function (ComponentParent, freightUnitHandler, Device, models) {
	"use strict";

	return ComponentParent.extend("com.westernacher.collaborationPortal.freightUnit.Component", {
		defaultAnnotation: "com/westernacher/collaborationPortal/freightUnit/annotations",
		metadata: {
			manifest: "json"
		},

		init: function () {
			ComponentParent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			this.ownerComponent = sap.ui.getCore().getComponent(this._sOwnerId);
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.initializeUtilHandlers();
		},
		initializeUtilHandlers: function () {
			ComponentParent.prototype.initializeUtilHandlers.apply(this, arguments);
			this._FreightUnitH = new freightUnitHandler(this);
		},
		_utilHandlersConfig: {
			mainEntitySet: "/FreightUnits",
			sSlugPropertyName: "FreightOrder",
			// attachmentsEntitySet: "/ZWCP_C_ConfirmationAttach",
			attachmentsTypeVisibility: true,
			// attachmentsTypeEntitySet: "ZWCP_I_ExecAttTypVH",
			idUpdateFUDialog: "idUpdateFUFreightUnitDialog",
			requiredHandlers: ["_FUH"]
		},
		_buttonsConfig: {
			updateFO: {
				entitySet: "FreightUnits",
				restriction: "updatable",
				propertyBinding: "V_AUpdateFU"
			},

			editItem: {
				entitySet: "FreightUnits",
				restriction: "updatable",
				propertyBinding: "V_AEditItem"
			},

		},
		_buttonsEnableConfig: {
			updateFO: {
				propertyBinding: "E_AUpdateFU",
				fieldControlBinding: "UpdateFC",
				none: false,
				single: true,
				multiple: false,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			},
			editItem: {
				propertyBinding: "E_AEditItem",
				fieldControlBinding: "EditItemsFC",
				none: false,
				single: true,
				multiple: false,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			}
		}

	});
});