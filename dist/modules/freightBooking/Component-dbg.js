sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ComponentParent",
	"com/westernacher/collaborationportal/freightBooking/util/freightBookingHandler",
	"sap/ui/Device",
	"./model/models"
], function (ComponentParent, freightBookingHandler, Device, models) {
	"use strict";

	return ComponentParent.extend("com.westernacher.collaborationportal.freightBooking.Component", {
		defaultAnnotation: "com/westernacher/collaborationportal/freightBooking/annotations",
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
			this._FreightBookingH = new freightBookingHandler(this);
		},
		_utilHandlersConfig: {
			mainEntitySet: "/FreightBookings",
			sSlugPropertyName: "FreightBookingID",
			attachmentsEntitySet: "/Attachments",
			attachmentsTypeVisibility: true,
			attachmentsTypeEntitySet: "ZWCP_I_TranspOrderAttTypVH",
			idUpdateFBDialog: "idUpdateFBFreightBookingDialog",
			requiredHandlers: ["_FBH", "_AttachH", "_ContainerH"]
		},
		_buttonsConfig: {
			updateFO: {
				entitySet: "FreightBookings",
				restriction: "updatable",
				propertyBinding: "V_AUpdateFU"
			},

			editItem: {
				entitySet: "FreightBookings",
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