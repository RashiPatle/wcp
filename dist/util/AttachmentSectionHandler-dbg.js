sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ParentModuleHandler",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/PDFViewer"
], function (ParentModuleHandler, JSONModel, MessageBox, MessageToast, PDFViewer) {
	"use strict";

	return ParentModuleHandler.extend("com.westernacher.collaborationPortal.core.util.AttachmentSectionHandler", {
		uploadAttachmentId: 'idUpdateFreightOrdersDialog',
		constructor: function (oController, sSlugPropertyName, sEntitySetName, bAttachmentsTypeVisibility, sAttachmentsTypeEntityName) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oComponent = oController;
			this._oActionModel = oController.getModel("_AM");
			this._oSelectedFOModel = oController.getModel("_SD");
			this._oUploadAttachmentVisualsConfigModel = oController.getModel("_DV");
			this._MD = oController._MD;

			this._oI18nModel = oController.getModel("i18nhome");

			this.sSlugPropertyName = sSlugPropertyName;
			this.sEntitySetName = sEntitySetName;
			this.bAttachmentsTypeVisibility = bAttachmentsTypeVisibility;
			this.sAttachmentsTypeEntityName = sAttachmentsTypeEntityName;
			this._oUploadAttachmentVisualsConfigModel.setData({
				"attachmentTypeVisibility": this.bAttachmentsTypeVisibility
			});
		},
		_getDialog: function () {
			var sServiceUrl = this._oComponent.getModel().sServiceUrl;
			var oCore = sap.ui.getCore();
			// create dialog lazily
			if (!this._oDialog) {
				// create dialog via fragment factory
				this._oDialog = sap.ui.xmlfragment(this.uploadAttachmentId,
					"com.westernacher.collaborationPortal.core.fragment.UploadAttachment", this);

				//setting upload url for the current role's odata service
				oCore.byId(this.uploadAttachmentId + "--UploadCollection").setUploadUrl(sServiceUrl + this.sEntitySetName);

				this._MD.callEntitySetDataLoad(this.sAttachmentsTypeEntityName, "AttachmentType");

				this.sUAttachType = oCore.byId(this.uploadAttachmentId + "--idAttachmentTypeCombo");
				this.sUAttachTypeDesc = oCore.byId(this.uploadAttachmentId + "--idAttachmentDescription");
				this.sUploadCollection = oCore.byId(this.uploadAttachmentId + "--UploadCollection");
			}
			return this._oDialog;
		},

		open: function (oView) {
			var oDialog = this._getDialog();
			// connect dialog to view (models, lifecycle)
			oView.addDependent(oDialog);
			// Setting table binding conext to fragment
			var oFOSelectedItem = this._oSelectedFOModel.getProperty("/SelectedItems");
			if (oFOSelectedItem.length > 0) {
				this._bindItemDataToFragment([oFOSelectedItem[0]], oDialog);
			}
			// open dialog
			oDialog.open();

			//obtaining attachments section table if called from the attachments table - for refresh of attachments table
			this.oAttachmentsTable = oView.byId("idAttachmentsTable");

		},
		onCloseUploadAttachment: function () {
			this._getDialog().close();
			this._getDialog().destroy();
			this._oDialog = null;
		},
		_getDialogNull: function () {},

		onChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource();

			var aFilesList = oEvent.getParameter("files");
			var cFiles = aFilesList.length;
			if (cFiles < 0) {
				return;
			}
			if (this.bAttachmentsTypeVisibility) {
				var sAttachType = this.sUAttachType.getSelectedKey();
				if (sAttachType) {
					var oCustomerHeaderAttachType = new sap.m.UploadCollectionParameter({
						name: "fileAttachmentType",
						value: sAttachType
					});
					oUploadCollection.addHeaderParameter(oCustomerHeaderAttachType);
				} else {
					this.sUAttachType.setValueState("Error");
					this.sUAttachType.setShowValueStateMessage(true);
					this.sUAttachType.setValueStateText("Please select the Attachment Type");
					return;
				}
			}

			var oCustomerHeaderFileName = new sap.m.UploadCollectionParameter({
				name: "fileName",
				value: aFilesList[0].name
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderFileName);

			var oCustomerHeaderFileMime = new sap.m.UploadCollectionParameter({
				name: "fileMIME",
				value: aFilesList[0].type
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderFileMime);

			var sFileDesciption = this.sUAttachTypeDesc.getValue();
			if (sFileDesciption) {
				var oCustomerHeaderFileDesc = new sap.m.UploadCollectionParameter({
					name: "fileDescription",
					value: sFileDesciption
				});
				oUploadCollection.addHeaderParameter(oCustomerHeaderFileDesc);
			}
		},

		onSelectionChangeAttachType: function () {
			//	var oAttachTypeCombo = this.getView().byId("idAttachmentTypeCombo");
			if (this.sUAttachType.getValue()) {
				this.sUAttachType.setValueState("None");
				this.sUAttachType.setShowValueStateMessage(false);
			} else {
				this.sUAttachType.setValueState("Error");
				this.sUAttachType.setShowValueStateMessage(true);
				this.sUAttachType.setValueStateText("Please select the Attachment Type");
			}
		},

		onConfirmUploadAttachment: function () {
			if (this.bAttachmentsTypeVisibility) {
				var sAttachType = this.sUAttachType.getSelectedKey();
				if (!sAttachType) {
					MessageBox.error(this._oI18nModel.getResourceBundle().getText("selectAttachmentType"));
					return;
				}

				var sAttachDescription = this.sUAttachTypeDesc.getValue();
				if (!sAttachDescription) {
					MessageBox.error(this._oI18nModel.getResourceBundle().getText("enterAttachmentDesription"));
					return;
				}
			}
			var cFiles = this.sUploadCollection.getItems().length;
			if (cFiles > 0) {
				this.sUploadCollection.upload();
				this.sUploadCollection.setBusy(true);
			}

		},

		onBeforeUploadStarts: function (oEvent) {
			var sFO,
				aSelectedFO = [];

			var aFOs = this._oSelectedFOModel.getProperty("/SelectedItems");

			for (var i = 0; i < aFOs.length; i++) {
				sFO = aFOs[i].getProperty(this.sSlugPropertyName);
				aSelectedFO.push(sFO);
			}

			var sAllFOForAttachment = aSelectedFO.join("|");

			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: sAllFOForAttachment
			});

			var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: this._oComponent.getModel().getHeaders()['x-csrf-token']
			});

			var oHTTPHeaderAccept = new sap.m.UploadCollectionParameter({
				name: "Accept",
				value: "application/json"
			});

			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
			oEvent.getParameters().addHeaderParameter(oHTTPHeaderAccept);
		},
		onUploadComplete: function (oEvent) {
			var sResponse = oEvent.getParameter("files")[0];
			if (sResponse.status == "201") {
				this.sUploadCollection.setBusy(false);
				MessageBox.success(sResponse.fileName + " " + this._oI18nModel.getResourceBundle().getText("uploadedSuccessfullMsg"));
				if (this.oAttachmentsTable) {
					this.oAttachmentsTable.getBinding("items").refresh();
				}
			} else if (sResponse.status == "400") {
				this.sUploadCollection.setBusy(false);
				var res = JSON.parse(sResponse.responseRaw);

				MessageBox.error(sResponse.fileName + " " + this._oI18nModel.getResourceBundle().getText("uploadFailureMsg"), {
					title: "Error", // default
					onClose: null, // default
					initialFocus: null,
					details: res.error.message.value
				});
			}
			this.onCloseUploadAttachment();
		},

		onUploadTerminated: function (oEvent) {

		},

		onDeleteAttachmentPress: function () {
			var aAttachments = this._oSelectedFOModel.getProperty("/SelectedAttachments");
			MessageBox.confirm(this._oI18nModel.getResourceBundle().getText("deleteAttachmentConfirmation"), {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "sapUiSizeCompact",
				onClose: function (oAction) {
					if (oAction === "YES") {
						for (var i = 0; i < aAttachments.length; i++) {
							var sPath = aAttachments[0].sPath;
							aAttachments[0].oModel.remove(sPath, {
								success: function () {
									if (this.oAttachmentsTable) {
										this.oAttachmentsTable.getBinding("items").refresh();
									}
								}.bind(this),
								error: function (oErr) {
									this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);
								}.bind(this)
							});
						}
					} else {
						return;
					}
				}.bind(this)
			});

		},

		onFetchAttachmentPress: function (oSource) {
			var sMediaSrc = oSource.data("url");
			var url = document.createElement('a');
			url.setAttribute('href', sMediaSrc);
			var sMediaSrcUri = url.pathname;
			/*	
				var oHTML = new HTML();
				oHTML.setContent("<iframe id='idAttachmentIframe'  width='700' height='700'></iframe>");
				var oPanel = new sap.m.Panel();
				oPanel.addContent(oHTML);
				var oAttachmentDisplayDialog = new Dialog({title:"Attachment"});
				oAttachmentDisplayDialog.addContent(oPanel);*/

			var oPDFViewer = new PDFViewer({
				title: "Attachment",
				source: sMediaSrcUri
			});
			oPDFViewer.open();

		},
		
		onFilenameLengthExceed: function () {
			MessageBox.error(this._oI18nModel.getResourceBundle().getText("uploadAttachmentNameExceedText"));
		},

		onFileSizeExceed: function () {
			MessageBox.error(this._oI18nModel.getResourceBundle().getText("uploadAttachmentSizeExceedText"));
		}

	});
});