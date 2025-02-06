sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ComponentParent",
	"com/westernacher/collaborationportal/confirmation/util/ConfirmationHandler",
	"sap/ui/Device",
	"./model/models"
], function (ComponentParent, ConfirmationHandler, Device, models) {
	"use strict";

	return ComponentParent.extend("com.westernacher.collaborationportal.confirmation.Component", {
		defaultAnnotation: "com/westernacher/collaborationportal/confirmation/annotations",
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
			this._ConfH = new ConfirmationHandler(this);
		},
		_utilHandlersConfig: {
			mainEntitySet: "/ZWCP_C_Confirmation",
			sSlugPropertyName: "FreightOrder",
			attachmentsEntitySet: "/ZWCP_C_ConfirmationAttach",
			attachmentsTypeVisibility: true,
			attachmentsTypeEntitySet: "ZWCP_I_ExecAttTypVH",
			idUpdateFODialog: "idUpdateConfFreightOrderDialog",
			requiredHandlers: ["_AttachH", "_CargoItemH", "_ResourceH", "_FOH"]
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
			},
			setFOInExecutionConfig: {
				entitySet: "ZWCP_C_Confirmation",
				restriction: "updatable",
				propertyBinding: "V_AUpdateFreightOrder"
			},
			uploadAttachments: {
				entitySet: "ZWCP_C_ConfirmationAttach",
				restriction: "creatable",
				propertyBinding: "V_AUploadAttachments"
			},
			deleteAttachments: {
				entitySet: "ZWCP_C_ConfirmationAttach",
				restriction: "deletable",
				propertyBinding: "V_ADeleteAttachments"
			},
			acceptFO: {
				entitySet: "ZWCP_C_Confirmation",
				restriction: "accept",
				propertyBinding: "V_ASetAccept"
			},
			rejectFO: {
				entitySet: "ZWCP_C_Confirmation",
				restriction: "reject",
				propertyBinding: "V_ASetRejected"
			},
			updateFO: {
				entitySet: "ZWCP_C_Confirmation",
				restriction: "updatable",
				propertyBinding: "V_AUpdateFO"
			},
			//Newly added fields for items:
			createItem: {
				entitySet: "ZWCP_C_ConfirmationItems",
				restriction: "creatable",
				propertyBinding: "V_ACreateItem"
			},
			editItem: {
				entitySet: "ZWCP_C_ConfirmationItems",
				restriction: "updatable",
				propertyBinding: "V_AEditItem"
			},
			deleteItem: {
				entitySet: "ZWCP_C_ConfirmationItems",
				restriction: "deletable",
				propertyBinding: "V_ADeleteItem"
			}

		},
		_buttonsEnableConfig: {
			// 			acceptFOConfig: {
			// 				propertyBinding: "/E_ASetComplete",
			// 				fieldControlBinding: "",
			// 				none: false,
			// 				single: true,
			// 				multiple: true,
			// 				enabled: false,
			// 				allStrict: false,
			// 				properties: {},
			// 				propertiesBinding: {}

			// 			},
			// 			rejectFOConfig: {
			// 				propertyBinding: "/E_ASetCancelled",
			// 				fieldControlBinding: "",
			// 				none: false,
			// 				single: true,
			// 				multiple: true,
			// 				enabled: false,
			// 				allStrict: false,
			// 				properties: {},
			// 				propertiesBinding: {}
			// 			},
			// 			setFOInExecutionConfig: {
			// 				propertyBinding: "/E_AUpdateFreightOrder",
			// 				fieldControlBinding: "",
			// 				none: false,
			// 				single: true,
			// 				multiple: true,
			// 				enabled: false,
			// 				allStrict: false,
			// 				properties: {},
			// 				propertiesBinding: {}
			// 			},
			deleteAttachments: {
				propertyBinding: "E_ADeleteAttachments",
				fieldControlBinding: "DeleteAttachmentsFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			},
			uploadAttachments: {
				propertyBinding: "E_AUploadAttachments",
				fieldControlBinding: "UploadAttachmentsFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			},
			acceptFO: {
				propertyBinding: "E_ASetAccept",
				fieldControlBinding: "AcceptFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			},
			rejectFO: {
				propertyBinding: "E_ASetRejected",
				fieldControlBinding: "RejectFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			},
			updateFO: {
				propertyBinding: "E_AUpdateFO",
				fieldControlBinding: "UpdateFOFC",
				none: false,
				single: true,
				multiple: false,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			},
			createItem: {
				propertyBinding: "E_ACreateItem",
				fieldControlBinding: "CreateItemsFC",
				none: false,
				single: true,
				multiple: true,
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
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			}
		}

	});
});