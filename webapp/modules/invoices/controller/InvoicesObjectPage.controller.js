sap.ui.define([
	"com/westernacher/collaborationportal/core/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat",
	"com/westernacher/collaborationportal/core/model/formatter",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/core/routing/History",
	"sap/ui/model/type/Currency"
], function (BaseController, Controller, Filter, FilterOperator, DateFormat, formatter, HashChanger, History, Currency) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationportal.invoices.controller.InvoicesObjectPage", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.westernacher.collaborationportal.confirmation.WCP_EXECUTION.view.ConfirmationObjectPage
		 */
		coreFormatter: formatter,

		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.oComponent.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			this.bNewDataInRequest = false;

			this._oDVModel = this.oComponent.getModel("_DV");
			this._oCIModel = this.oComponent.getModel("_CI");
		},

		onRouteMatched: function (oEvent) {
			sap.ui.core.BusyIndicator.hide();
			var oParameter = oEvent.getParameter("arguments");
			var oView = this.getView();

			this._oDVModel.setProperty("/VAcceptButton", true);
			this._oDVModel.setProperty("/VSubmitButton", false);

			var sKey = oParameter.InvoiceUUID;
			if (!sKey) {
				return;
			}

			this._oCIModel.setProperty("/FreightOrders", []);

			var oModel = this.oComponent._InvoicesH.setRoleModel(true, this.getView(), "INVOICE", this.oComponent.defaultAnnotation);
			oModel.getMetaModel().loaded().then(function () {
				try {
					this.oComponent._AH.checkUserRoleMetaModel(oModel, this.oComponent._InvoicesH.sUserRole);
					this.oComponent._AH.checkUserRoleMetaModelForEntity(oModel, this.oComponent._InvoicesH.sUserRole, "ZWCP_C_SETLCarrierInvoices");
				} catch (er) {
					return;
				}
			}.bind(this));

			oModel.metadataLoaded().then(function () {
				this.sObjectPath = oView.getModel().createKey("ZWCP_C_SETLCarrierInvoices", {
					InvoiceUUID: sKey
				});

				this._bindView("/" + this.sObjectPath);

				this.callFreightOrdersData(this.sObjectPath, sKey);
			}.bind(this));

		},

		_bindView: function (sObjectPath) {
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					dataRequested: function (oEvent) {
						this.bNewDataInRequest = true;
					}.bind(this),
					change: function () {
						if (this.bNewDataInRequest === false) {
							this.getView().getElementBinding().refresh(false);
						}
						var aFOs = this._prepareBindingContextsDataFromObjectPage(this);
						this.getView().getModel("_SD").setProperty("/SelectedItems", aFOs);
						this.oComponent._BEH.onObjectPageSelectionChange(this.getView().getBindingContext().getObject());
					}.bind(this),
					dataReceived: function (oEvent) {
						this.bNewDataInRequest = false;

					}.bind(this)
				}
			});
		},

		callFreightOrdersData: function (sObjectPath, sInvoiceKey) {
			var oModel = this.getView().getModel();

			var oFilterProp = new Filter("InvoiceUUID", "EQ", sInvoiceKey);

			oModel.read("/" + sObjectPath + "/to_FreightOrders", {
				success: function (oData, oResponse) {
					var aFreightOrders = oData.results;
					if (!(this.oComponent.getModel("_MD").getProperty("/ChargeTypesLoaded"))) {
						//fetch Charge and Tax types - Configuration objects
						this.oComponent._InvoicesH._prepareChargeAndTaxTypes(aFreightOrders);
					}

					try {
						aFreightOrders.forEach(function (oFO) {
							var sFOPath = oModel.createKey("ZWCP_C_SETLFreightOrders", {
								TransportationOrderUUID: oFO.TransportationOrderUUID
							});

							oModel.read("/" + sFOPath + "/to_ChargeItems", {
								filters: [oFilterProp],
								success: function (oDataAssociation, oResponseAssociation) {

									this.oComponent._InvoicesH.addFODataToInvoiceInfo(oFO, oDataAssociation.results);
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

		// onRejectFOPress: function (oEvent) {
		// 	this.oComponent._QuotationH.onRejectFOPress();
		// },
		/** 
		 * Handles on press event of accept button
		 * @param {sap.ui.base.Event} [oEvent] oSource and oParameter from the control
		 * 
		 */
		onAcceptInvoicePress: function (oEvent) {
			var aInvoices = this.oComponent.getModel("_SD").getProperty("/SelectedItems");
			this.oComponent._AH.onActionNoInputPress(aInvoices, oEvent.getSource());
		},

		onSubmitInvoicePress: function (oEvent) {
			this.oComponent._InvoicesH.onSubmitInvoice(oEvent);
		},

		/** 
		 * Handles on press event of edit proposal button
		 * @param {sap.ui.base.Event} [oEvent] oSource and oParameter from the control
		 * 
		 */
		onEditInvoicePress: function (oEvent) {
			var aInvoices = this.oComponent.getModel("_SD").getProperty("/SelectedItems");
			this._oCIdata = jQuery.extend(true, {}, this._oCIModel.getProperty("/"));
			this._oDVModel.setProperty("/VAcceptButton", false);
			this._oDVModel.setProperty("/VSubmitButton", true);
		},

		onPressDiscardChanges: function () {
			this._oCIModel.setProperty("/", this._oCIdata);
			this._oCIModel.refresh(true);
			this._oCIdata = null;
			this._oDVModel.setProperty("/VAcceptButton", true);
			this._oDVModel.setProperty("/VSubmitButton", false);
		},

		submitButtonVisibility: function (bValue) {
			if (!bValue) {
				return false;
			}

		},
		navigateToEditInvoiceView: function (sInvoiceId) {
			this.oComponent.getRouter().navTo("editInvoice", {
				invoiceId: sInvoiceId
			});
		},
		preapreCreateInvoiceObject: function (aSelectedFOsBindingContexts) {
			var aFreightOrders = [];
			for (var i = 0; i < aSelectedFOsBindingContexts.length; i++) {
				var oFO = {};
				oFO.TransportationOrderUUID = aSelectedFOsBindingContexts[i].getObject(aSelectedFOsBindingContexts[i].getPath()).InvoiceUUID;
				// oFO.CarrierUUID = aSelectedFOsBindingContexts[i].getProperty("CarrierUUID");
				aFreightOrders.push(oFO);
			}
			return aFreightOrders;
		},
		onHomeLinkPress: function (oEvent) {
			var oHashChanger = HashChanger.getInstance();
			oHashChanger.init();
			oHashChanger.setHash("");
		},

		onPressBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				// Back to worklist, if there is no previous history, Generally if we refresh the page at object page
				var oHashChanger = HashChanger.getInstance(),
					_oMDModel = this.oComponent.ownerComponent.getModel("_MD");
				oHashChanger.init();
				oHashChanger.setHash("Invoices/" + _oMDModel.getProperty("/UserInfo/CurrentBusinessPartnerRole"));
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

		onUpdateFOQuantitiesPress: function (oEvent) {
			this.oComponent._InvoicesH.onUpdateFOQuantities(oEvent);
		},

		onAddChargePress: function (oEvent) {
			this.oComponent._InvoicesH.onAddCharge(oEvent, this.getView(), this.refreshView.bind(this));
		},
		onAddTaxPress: function (oEvent) {
			this.oComponent._InvoicesH.onAddTax(oEvent, this.getView(), this.refreshView.bind(this));
		},

		onUpdateChargePress: function (oEvent) {
			this.oComponent._InvoicesH.onUpdateCharge(oEvent, this.refreshView.bind(this));
		},

		onRemoveChargeProposalPress: function (oEvent) {
			this.oComponent._InvoicesH.onRemoveChargeProposal(oEvent, this.refreshView.bind(this));
		},

		onExcludeChargeItemPress: function (oEvent) {
			this.oComponent._InvoicesH.onExcludeChargeItem(oEvent, this.refreshView.bind(this));
		},

		onIncludeChargeItemPress: function (oEvent) {
			this.oComponent._InvoicesH.onIncludeChargeItem(oEvent, this.refreshView.bind(this));
		},

		refreshView: function (sPathFO) {
			this.getView().getElementBinding().refresh(false);
		},

		editLogisticalFOButtonVisibility: function (bEditMode, bQuantityChangeAllowed) {
			if (bEditMode && bQuantityChangeAllowed) {
				return true;
			} else {
				return false;
			}
		},

		addChargeButtonVisibility: function (bEditMode, bNewChargeAllowed) {
			if (bEditMode && bNewChargeAllowed) {
				return true;
			} else {
				return false;
			}
		},

		addTaxButtonVisibility: function (bEditMode, bNewChargeAllowed) {
			if (bEditMode && bNewChargeAllowed) {
				return true;
			} else {
				return false;
			}
		}

	});

});