sap.ui.define([
	"com/westernacher/collaborationportal/core/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat",
	"com/westernacher/collaborationportal/core/model/formatter",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/core/routing/History",
	"sap/ui/model/type/Currency",
	"sap/m/MessageBox"
], function (BaseController, Controller, Filter, FilterOperator, DateFormat, formatter, HashChanger, History, Currency, MessageBox) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationportal.invoicesubmission.controller.CreateInvoice", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.westernacher.collaborationportal.confirmation.WCP_EXECUTION.view.ConfirmationObjectPage
		 */
		formatter: formatter,

		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.oComponent.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			this.bNewDataInRequest = false;
			this.oModel = this.oComponent._InvoiceSubH.setRoleModel(true, this.getView(), "INVOICE_SUBMISSION", this.oComponent.defaultAnnotation);

			/*	this.ifAnyChangedRateAmount = false;
				this.ifAnyChangedFinalAmount = false;
				this.ifAnyChangedRateTaxAmount = false;
				this.ifAnyChangedFinalTaxAmount = false;*/
		},

		onRouteMatched: function (oEvent) {
			var oParameter = oEvent.getParameter("arguments");
			var oView = this.getView();
			var sKey = oParameter.invoiceId;
			var oView = this.getView();
			if (!sKey) {
				var oInvoiceNumber = oView.byId("idInvoiceNumber");
				oInvoiceNumber.setText("");
				return;
			}
			this.oComponent._InvoiceSubH._clearFreightOrdersData();

			//this.oComponent._InvoiceSubH._getChargeAndTaxTypes();

			oView.getModel().getMetaModel().loaded().then(function () {
				try {
					this.oComponent._AH.checkUserRoleMetaModel(this.oModel, this.oComponent._InvoiceSubH.sUserRole);
					//	this.oComponent._AH.checkUserRoleMetaModelForEntity(this.oModel, this.oComponent._QuotationH.sUserRole, "ZWCP_C_RFQ");
				} catch (er) {
					return;
				}
			}.bind(this));

			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = oView.getModel().createKey("ZWCP_C_SETLCarrierInvoices", {
					InvoiceUUID: sKey
				});
				//	var sObjectPath = "ZWCP_C_SETLCarrierInvoices(guid'02fa43b3-d2ca-1eea-8f91-b174e9e7ff68')"; 
				this._bindView("/" + sObjectPath);
				//	this.callFreightOrdersData(JSON.parse(sSelectedFOs), sKey);
				this.callFreightOrdersData(sObjectPath, sKey);
			}.bind(this));
			// }.bind(this));
			this.oComponent._BEH.onObjectPageSelectionChange(sKey);

		},

		_bindView: function (sObjectPath) {
			this.getView().bindElement({
				path: sObjectPath,
				parameters: {
					expand: 'to_Attachments'
				},
				events: {
					dataRequested: function (oEvent) {
						this.bNewDataInRequest = true;
					}.bind(this),
					change: function (oResponse) {
						if (this.bNewDataInRequest === false) {
							this.getView().getElementBinding().refresh(false);
						}
						var aInvoices = this._prepareBindingContextsDataFromObjectPage(this);
						this.getView().getModel("_SD").setProperty("/SelectedItems", aInvoices);
						var oBindingContext = this.getView().getBindingContext();

						this.oComponent._BEH.onObjectPageSelectionChange(oBindingContext.getObject());

					}.bind(this),
					dataReceived: function (oEvent) {
						this.bNewDataInRequest = false;

					}.bind(this)
				}
			});
		},
		callFreightOrdersData: function (sObjectPath, sInvoiceKey) {
			var oModel = this.getView().getModel();
			// for (var i = 0; i < aFreightOrders.length; i++) {
			// 	var sObjectPath = oModel.createKey("ZWCP_C_SETLFreightOrders", {
			// 		TransportationOrderUUID: aFreightOrders[i]
			// 	});

			var oFilterProp = new Filter("InvoiceUUID", "EQ", sInvoiceKey);

			oModel.read("/" + sObjectPath + "/to_FreightOrders", {
				// urlParameters: {
				// 	"$expand": "to_FreightOrders"
				// },
				//	filters: [oFilterProp],
				success: function (oData, oResponse) {
					var aFreightOrders = oData.results;

					if (!(this.oComponent.getModel("_MD").getProperty("/ChargeTypesLoaded"))) {
						//fetch Charge and Tax types - Configuration objects
						this.oComponent._InvoiceSubH._prepareChargeAndTaxTypes(aFreightOrders);
					}

					try {
						aFreightOrders.forEach(function (oFO) {
							var sFOPath = oModel.createKey("ZWCP_C_SETLFreightOrders", {
								TransportationOrderUUID: oFO.TransportationOrderUUID
							});

							oModel.read("/" + sFOPath + "/to_ChargeItems", {
								filters: [oFilterProp],
								success: function (oDataAssociation, oResponseAssociation) {

									this.oComponent._InvoiceSubH.addFODataToInvoiceInfo(oFO, oDataAssociation.results);
								}.bind(this)
							});
						}, this);
					} catch (oErr) {
						return;
					}

				}.bind(this)
			});
			//	}
		},

		onUpdateInvoiceHeaderPress: function (oEvent) {
			this.oComponent._InvoiceSubH.onUpdateInvoiceHeader(oEvent, this.refreshInvoiceNumberDate.bind(this));
		},
		onCancelInvoicePress: function (oEvent) {
			this.oComponent._InvoiceSubH.onCancelInvoice(oEvent);
		},

		onSubmitInvoicePress: function (oEvent) {
			var oView = this.getView();
			var sInvoiceNumber = oView.byId("idInvoiceNumber").getText();
			var dInvoiceDate = oView.byId("idInvoiceDate").getDateValue();
			if (sInvoiceNumber) {
				this.oComponent._InvoiceSubH.onSubmitInvoice(oEvent, sInvoiceNumber, dInvoiceDate);
			} else {
				MessageBox.error("Please provide Invoice Number", {
					onclose: null
				});
			}
		},

		refreshInvoiceNumberDate: function (sInvoiceNumber, dInvoiceDate) {
			var oView = this.getView();
			var oInvoiceNumber = oView.byId("idInvoiceNumber");
			var oInvoiceDate = oView.byId("idInvoiceDate");
			oInvoiceNumber.unbindElement();
			oInvoiceDate.unbindElement();

			var oContext = oView.getBindingContext();
			oContext.getModel().setProperty(oContext.sPath + "/CarrierReference", sInvoiceNumber);
			oContext.getModel().setProperty(oContext.sPath + "/InvoiceDate", dInvoiceDate);

			oInvoiceNumber.setBindingContext(oContext);
			oInvoiceDate.setBindingContext(oContext);

		},

		onCalculateChargesPress: function (oEvent) {
			var fnSuccessCallback = function () {
				this.getView().getElementBinding().refresh(false);
			};
			this.oComponent._InvoiceSubH.onCalculateCharge(oEvent, fnSuccessCallback.bind(this));
		},
		onUpdateFOQuantitiesPress: function (oEvent) {
			this.oComponent._InvoiceSubH.onUpdateFOQuantities(oEvent, this.refreshView.bind(this));
		},
		onAddChargePress: function (oEvent) {
			this.oComponent._InvoiceSubH.onAddCharge(oEvent, this.getView(), this.refreshView.bind(this));
		},
		onAddTaxPress: function (oEvent) {
			this.oComponent._InvoiceSubH.onAddTax(oEvent, this.getView(), this.refreshView.bind(this));
		},
		onUpdateChargePress: function (oEvent) {
			this.oComponent._InvoiceSubH.onUpdateCharge(oEvent, this.refreshView.bind(this));

		},

		onRemoveChargeProposalPress: function (oEvent) {
			this.oComponent._InvoiceSubH.onRemoveChargeProposal(oEvent, this.refreshView.bind(this));
		},

		onExcludeChargeItemPress: function (oEvent) {
			this.oComponent._InvoiceSubH.onExcludeChargeItem(oEvent, this.refreshView.bind(this));
		},

		onIncludeChargeItemPress: function (oEvent) {
			this.oComponent._InvoiceSubH.onIncludeChargeItem(oEvent, this.refreshView.bind(this));
		},

		refreshView: function (sPathFO) {
			this.getView().getElementBinding().refresh(false);
		},

		onDeleteAttachmentPress: function (oEvent) {
			var oFOAttachment = oEvent.getSource().getBindingContext();
			this.getView().getModel("_SD").setProperty("/SelectedAttachments", [oFOAttachment]);
			this.getOwnerComponent()._AttachH.onDeleteAttachmentPress();
		},

		onFetchAttachmentPress: function (oEvent) {
			var oSource = oEvent.getSource();
			this.getOwnerComponent()._AttachH.onFetchAttachmentPress(oSource);
		},

		onUploadAttachmentPress: function (oEvent) {
			this.getOwnerComponent()._AttachH.open(this.getView());
		},

		GreyOutExcludedChargeItems: function (sPathFO) {
			var oView = this.getView();
			var oCIModel = this.getView().getModel("_CI");
			var oChargeTable = oView.byId("idChargesInInvoiceSubmissionTable");

			var aChargeItemsReceived = oCIModel.getProperty(sPathFO + "/to_ChargeItems");

			//To be done - on hold

		},

		GreyInExcludedChargeItems: function (sPathFO) {
			//To be done - on hold
		},

		proposedQuantityColumnVisibilityCheck: function (sTransportationOrderUUID) {
			if (this.ifAnyChangedQuantity) {
				this.ifAnyChangedQuantity = false;
				return true;
			} else {
				return false;
			}
		},

		proposedAmountColumnVisibilityCheck: function (sTransportationOrderUUID) {
			if (this.ifAnyChangedRateAmount) {
				this.ifAnyChangedRateAmount = false;
				return true;
			} else {
				return false;
			}
		},

		proposedFinalAmountColumnVisibility: function (sTransportationOrderUUID) {
			if (this.ifAnyChangedFinalAmount) {
				this.ifAnyChangedFinalAmount = false;
				return true;
			} else {
				return false;
			}
		},

		proposedTaxAmountColumnVisibilityCheck: function (sTransportationOrderUUID) {
			if (this.ifAnyChangedRateTaxAmount) {
				this.ifAnyChangedRateTaxAmount = false;
				return true;
			} else {
				return false;
			}
		},

		proposedTaxFinalAmountColumnVisibility: function (sTransportationOrderUUID) {
			if (this.ifAnyChangedFinalTaxAmount) {
				this.ifAnyChangedFinalTaxAmount = false;
				return true;
			} else {
				return false;
			}
		},

		checkChangedQuantityVisibility: function (fChangedQuantity, fQuantity) {
			if ((parseFloat(fChangedQuantity)) && (parseFloat(fChangedQuantity) !== parseFloat(fQuantity))) {
				this.ifAnyChangedQuantity = true;
				return true;
			} else {
				return false;
			}
		},

		checkChangedRateAmountVisibility: function (fChangedRateAmount, bTaxIndicator) {
			if (parseFloat(fChangedRateAmount)) {
				if (bTaxIndicator) {
					this.ifAnyChangedRateTaxAmount = true;
					return true;
				} else {
					this.ifAnyChangedRateAmount = true;
					return true;
				}
			} else {
				return false;
			}
		},

		checkChangedFinalAmountVisibility: function (fChangedFinalAmount, bTaxIndicator) {
			if (parseFloat(fChangedFinalAmount)) {
				if (bTaxIndicator) {
					this.ifAnyChangedFinalTaxAmount = true;
					return true;
				} else {
					this.ifAnyChangedFinalAmount = true;
					return true;
				}
			} else {
				return false;
			}
		},

		checkRemoveProposalButtonVisibility: function (fChangedFinalAmount) {
			if (parseFloat(fChangedFinalAmount)) {
				return true;
			} else {
				return false;
			}
		},

		checkDeleteButtonVisibility: function (fChangedFinalAmount, bInvoiceIrrelevanceIndicator) {
			if (!bInvoiceIrrelevanceIndicator) {
				if (!(parseFloat(fChangedFinalAmount))) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		},

		onRefreshObjectView: function () {
			this.getView().getBindingContext().getModel().refresh(true);
		}

	});

});