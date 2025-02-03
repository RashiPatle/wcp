sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ComponentParent",
	"com/westernacher/collaborationPortal/invoicesubmission/util/InvoiceSubmissionHandler",
	"sap/ui/Device",
	"./model/models"
], function (ComponentParent, InvoiceSubmissionHandler, Device, models) {
	"use strict";

	return ComponentParent.extend("com.westernacher.collaborationPortal.invoicesubmission.Component", {
		defaultAnnotation: "com/westernacher/collaborationPortal/invoicesubmission/annotations",
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
			this._InvoiceSubH = new InvoiceSubmissionHandler(this);
		},
		_utilHandlersConfig: {
			mainEntitySet: "/ZWCP_C_SETLFreightOrders",
			sSlugPropertyName: "InvoiceUUID",
			attachmentsEntitySet: "/ZWCP_C_SETLAttachments",
			attachmentsTypeVisibility: false,
			requiredHandlers: ["_StopH", "_AttachH"],
			sItemsPropertyName: "to_ItemsByAct"
		},
		_buttonsConfig: {
			createInvoiceConfig: {
				entitySet: "ZWCP_C_SETLCarrierInvoices",
				restriction: "creatable",
				propertyBinding: "V_ACreateInvoice"
			},
			cancelInvoiceConfig: {
				entitySet: "ZWCP_C_SETLCarrierInvoices",
				restriction: "cancelInvoice",
				propertyBinding: "V_ACancelInvoice"
			},
			submitInvoiceConfig: {
				entitySet: "ZWCP_C_SETLCarrierInvoices",
				restriction: "submitInvoice",
				propertyBinding: "V_ASubmitInvoice"
			},
			calculateChargesConfig: {
				entitySet: "ZWCP_C_SETLCarrierInvoices",
				restriction: "calculateInvoiceCharges",
				propertyBinding: "V_ACalculateCharges"
			},
			// UpdateCarrierRefConfig: {
			// 	entitySet: "ZWCP_C_SETLCarrierInvoices",
			// 	restriction: "creatable",
			// 	propertyBinding: "V_AUpdateCarrierRef"
			// },
			uploadAttachments: {
				entitySet: "ZWCP_C_SETLAttachments",
				restriction: "creatable",
				propertyBinding: "V_AUploadAttachments"
			},
			deleteAttachments: {
				entitySet: "ZWCP_C_SETLAttachments",
				restriction: "deletable",
				propertyBinding: "V_ADeleteAttachments"
			}
		},
		_buttonsEnableConfig: {
			createInvoiceConfig: {
				propertyBinding: "E_ACreateInvoice",
				fieldControlBinding: "AcceptInvoiceFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				anyValue: true,
				properties: {},
				propertiesBinding: {}
			}

			// updateCarrierRefConfig: {
			// 	propertyBinding: "/E_AUpdateCarrierRef",
			// 	none: false,
			// 	single: true,
			// 	multiple: true,
			// 	enabled: false,
			// 	allStrict: false,
			// 	anyValue: true,
			// 	properties: {
			// 		//"InvoicingStatusCode": ["00"]
			// 	},
			// 	propertiesBinding: {
			// 		// "GWConfStatus": "/Visible_FFoGwConfStat"
			// 	}
			// }

		}

	});
});