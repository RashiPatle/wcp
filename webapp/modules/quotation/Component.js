sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ComponentParent",
	"com/westernacher/collaborationPortal/quotation/util/QuotationHandler",
	"sap/ui/Device",
	"./model/models"
], function (ComponentParent, QuotationHandler, Device, models) {
	"use strict";

	return ComponentParent.extend("com.westernacher.collaborationPortal.quotation.Component", {
		defaultAnnotation: "com/westernacher/collaborationPortal/quotation/annotations",
		metadata: {
			manifest: "json"
		},

		init: function () {
			ComponentParent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			this.ownerComponent = sap.ui.getCore().getComponent(this._sOwnerId);
			this.initializeUtilHandlers();
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		},
		initializeUtilHandlers: function () {
			ComponentParent.prototype.initializeUtilHandlers.apply(this, arguments);
			this._QuotationH = new QuotationHandler(this);
		},
		_utilHandlersConfig: {
			mainEntitySet: "/ZWCP_C_RFQ",
			requiredHandlers: ["_StopH"],
			sItemsPropertyName: "to_ItemsByAct"
		},
		_buttonsConfig: {
			acceptFOConfig: {
				entitySet: 'ZWCP_C_RFQ',
				restriction: 'accept',
				propertyBinding: 'V_ASetAccept'
			},
			rejectFOConfig: {
				entitySet: 'ZWCP_C_RFQ',
				restriction: 'reject',
				propertyBinding: 'V_ASetRejected'
			},
			acceptWithChangeConfig: {
				entitySet: 'ZWCP_C_RFQ',
				restriction: 'updatable',
				propertyBinding: 'V_ASetAcceptChange'
			}
		},
		_buttonsEnableConfig: {
			acceptFOConfig: {
				propertyBinding: 'E_ASetAccept',
				fieldControlBinding: "AcceptFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}

			},
			rejectFOConfig: {
				propertyBinding: 'E_ASetRejected',
				fieldControlBinding: "RejectFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			},
			acceptWithChangeConfig: {
				propertyBinding: 'E_ASetAcceptChange',
				fieldControlBinding: "AcceptWithChangeFC",
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