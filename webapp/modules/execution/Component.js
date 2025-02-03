	sap.ui.define([
		"com/westernacher/collaborationPortal/core/util/ComponentParent",
		"sap/ui/core/AppCacheBuster",
		"com/westernacher/collaborationPortal/fosExecution/util/ExecutionHandler",
		"sap/ui/Device",
		"./model/models"
	], function (ComponentParent, AppCacheBuster, ExecutionHandler, Device, models) {
		"use strict";

		return ComponentParent.extend("com.westernacher.collaborationPortal.fosExecution.Component", {
			defaultAnnotation: "com/westernacher/collaborationPortal/fosExecution/annotations",
			metadata: {
				manifest: "json"
			},

			init: function () {
				ComponentParent.prototype.init.apply(this, arguments);
				this.getRouter().initialize();
				this.ownerComponent = sap.ui.getCore().getComponent(this._sOwnerId);
				this.initializeUtilHandlers();
				this._ExecH = new ExecutionHandler(this);
				var oOwnerComponentRouter = this.ownerComponent.getRouter();
				oOwnerComponentRouter.getRoute("EXECUTION").attachMatched(function (oEvent) {
					var oParameters = oEvent.getParameter("arguments");
					this.sRole = oParameters.UserRole;
				}.bind(this));
				// set the device model
				this.setModel(models.createDeviceModel(), "device");
			},

			initializeUtilHandlers: function () {
				ComponentParent.prototype.initializeUtilHandlers.apply(this, arguments);
				this._ExecH = new ExecutionHandler(this);
			},
			_utilHandlersConfig: {
				mainEntitySet: "/ZWCP_C_Execution",
				sSlugPropertyName: "FreightOrder",
				attachmentsEntitySet: "/ZWCP_C_ExecutionAttach",
				attachmentsTypeVisibility: true,
				attachmentsTypeEntitySet: "ZWCP_I_ExecAttTypVH",
				eventsTypeEntitySet: "/ExecutionSet",
				idUpdateFODialog: "idUpdateExecFreoghtOrderDialog",
				requiredHandlers: ["_AttachH", "_CargoItemH", "_ResourceH", "_FOH", "_EventH", "_CargoItemHExecution"]
			},
			_buttonsConfig: {
				acceptFOConfig: {
					entitySet: 'ZWCP_C_Execution',
					restriction: 'setComplete',
					propertyBinding: 'V_ASetComplete'
				},
				rejectFOConfig: {
					entitySet: 'ZWCP_C_Execution',
					restriction: 'setCancelled',
					propertyBinding: 'V_ASetCancelled'
				},
				updateFO: {
					entitySet: 'ZWCP_C_Execution',
					restriction: 'updatable',
					propertyBinding: 'V_AUpdateFreightOrder'
				},
				uploadAttachments: {
					entitySet: 'ZWCP_C_ExecutionAttach',
					restriction: 'creatable',
					propertyBinding: 'V_AUploadAttachments'
				},
				deleteAttachments: {
					entitySet: 'ZWCP_C_ExecutionAttach',
					restriction: 'deletable',
					propertyBinding: 'V_ADeleteAttachments'
				},
				acceptFO: {
					entitySet: 'ZWCP_C_Execution',
					restriction: 'accept',
					propertyBinding: 'V_ASetAccept'
				},
				rejectFO: {
					entitySet: 'ZWCP_C_Execution',
					restriction: 'reject',
					propertyBinding: 'V_ASetRejected'
				},
				//Newly added fields for items:
				createItem: {
					entitySet: "ZWCP_C_ExecutionItems",
					restriction: "creatable",
					propertyBinding: "V_ACreateItem"
				},
				editItem: {
					entitySet: "ZWCP_C_ExecutionItems",
					restriction: "updatable",
					propertyBinding: "V_AEditItem"
				},
				deleteItem: {
					entitySet: "ZWCP_C_ExecutionItems",
					restriction: "deletable",
					propertyBinding: "V_ADeleteItem"
				}

			},
			_buttonsEnableConfig: {
				setToCompleteFOConfig: {
					propertyBinding: 'E_ASetComplete',
					fieldControlBinding: "SetToCompleteFC",
					none: false,
					single: true,
					multiple: true,
					enabled: false,
					allStrict: false,
					properties: {},
					propertiesBinding: {}

				},
				setToCancelledFOConfig: {
					propertyBinding: 'E_ASetCancelled',
					fieldControlBinding: "SetToCancelFC",
					none: false,
					single: true,
					multiple: true,
					enabled: false,
					allStrict: false,
					properties: {},
					propertiesBinding: {}
				},
				uploadAttachments: {
					propertyBinding: 'E_AUploadAttachments',
					fieldControlBinding: "UploadAttachmentsFC",
					none: false,
					single: true,
					multiple: true,
					enabled: false,
					allStrict: false,
					properties: {},
					propertiesBinding: {}
				},

				updateFO: {
					propertyBinding: 'E_AUpdateFreightOrder',
					fieldControlBinding: "UpdateFOFC",
					none: false,
					single: true,
					multiple: false,
					enabled: false,
					allStrict: false,
					properties: {},
					propertiesBinding: {}
				},
				deleteAttachments: {
					propertyBinding: 'E_ADeleteAttachments',
					fieldControlBinding: "DeleteAttachmentsFC",
					none: false,
					single: true,
					multiple: true,
					enabled: false,
					allStrict: false,
					properties: {},
					propertiesBinding: {}

				},

				updateCargoItem: {
					propertyBinding: 'E_AUpdateCargoItem',
					fieldControlBinding: "UpdateCargoItemFC",
					none: false,
					single: true,
					multiple: true,
					enabled: false,
					allStrict: false,
					properties: {},
					propertiesBinding: {}
				},
				//Newly added properties for Items:
				createItem: {
					propertyBinding: "E_ACreateItem",
					fieldControlBinding: "CreateItemFC",
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
					fieldControlBinding: "EditItemFC",
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