sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ComponentParent",
	"com/westernacher/collaborationportal/invoices/util/InvoicesHandler",
	"sap/ui/Device",
	"./model/models"
], function (ComponentParent, InvoicesHandler, Device, models) {
	"use strict";

	return ComponentParent.extend("com.westernacher.collaborationportal.invoices.Component", {
		defaultAnnotation: "com/westernacher/collaborationportal/invoices/annotations",
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
			this._InvoicesH = new InvoicesHandler(this);
		},
		_utilHandlersConfig: {
			mainEntitySet: "/ZWCP_C_SETLCarrierInvoices",
			sSlugPropertyName: "InvoiceUUID",
			attachmentsEntitySet: "/ZWCP_C_SETLAttachments",
			attachmentsTypeVisibility: false,
			requiredHandlers: ["_AttachH"]
		},
		_buttonsConfig: {
			acceptInvoiceConfig: {
				entitySet: "ZWCP_C_SETLCarrierInvoices",
				restriction: "acceptInvoice",
				propertyBinding: "V_AAcceptInvoice"
			},
			cancelInvoiceConfig: {
				entitySet: "ZWCP_C_SETLCarrierInvoices",
				restriction: "cancelInvoice",
				propertyBinding: "V_ACancelInvoice"
			},
			editProposalConfig: {
				entitySet: "ZWCP_C_SETLCarrierInvoices",
				restriction: "updatable",
				propertyBinding: "V_AEditProposal"
			},
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
			acceptInvoiceConfig: {
				propertyBinding: "E_AAcceptInvoice",
				fieldControlBinding: "AcceptInvoiceFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				enable: false,
				properties: {},
				propertiesBinding: {}
			},
			cancelInvoiceConfig: {
				propertyBinding: "E_ACancelInvoice",
				fieldControlBinding: "CancelInvoiceFC",
				none: false,
				single: true,
				multiple: true,
				enabled: false,
				allStrict: false,
				enable: false,
				properties: {},
				propertiesBinding: {}
			},
			EditProposalConfig: {
				propertyBinding: "E_AEditProposal",
				fieldControlBinding: "EditProposalFC",
				none: false,
				single: true,
				multiple: false,
				enable: false,
				allStrict: false,
				properties: {},
				propertiesBinding: {}
			}
		}

	});
});