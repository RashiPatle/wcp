sap.ui.define([
	"com/westernacher/collaborationPortal/core/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"com/westernacher/collaborationPortal/invoices/model/formatter",
	"com/westernacher/collaborationPortal/core/model/formatter"
], function (BaseController, Controller, DateFormat, Filter, FilterOperator, MessageBox, Fragment, JSONModel, formatter, coreFormatter) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationPortal.invoices.controller.InvoicesTable", {

		coreFormatter: coreFormatter,
		formatter: formatter,
		_aFilters: [],

		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.i18n = this.oComponent.getModel("i18n");
			this.oComponent.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			this.bFilterFlag = false;
			// this.oComponent._InvoiceSubH.setRoleModel(true, this.getView(), "INVOICE_SUBMISSION", this.defaultAnnotation);
			// this.getView().getModel().getMetaModel().loaded().then(function (oEvent) {
			// 	if (this.oComponent.ownerComponent) {
			// 		try {
			// 			this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._InvoiceSubH.sUserRole);
			// 		} catch (er) {
			// 			return;
			// 		}
			// 	}
			// }.bind(this));
			var oSmartTable = this.getView().byId("invoicesTable");
			this.oTable = oSmartTable;
			if (!sap.ui.Device.system.phone) {
				this.oSegmentedButton = this.getView().byId("idSegmentedFilter");
			} else {
				this.oSegmentedButton = this.getView().byId("idToolbarFilters");
			}
		},
		onRouteMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "master"){
				return;
			}
			// Clears item selection, Sets default button configuration on navigation
			this._clearListItemSelections();
			this.oComponent._InvoicesH.setRoleModel(true, this.getView(), "INVOICE", this.oComponent.defaultAnnotation);
			this.getView().getModel().getMetaModel().loaded().then(function (oEvent) {
				if (this.oComponent.ownerComponent) {
					try {
						this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._InvoicesH.sUserRole);
					} catch (er) {
						return;
					}
				}
			}.bind(this));
		},
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		},

		onTableItemPress: function (oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();
			this.oComponent.getRouter().navTo("object", {
				UserRole: this.oComponent._InvoicesH.sUserRole,
				Key: oBindingContext.getProperty("CarrierReference"),
				InvoiceUUID: oBindingContext.getProperty("InvoiceUUID")
			});
		},

		onRefreshList: function () {
			this.onRefreshTableList(this.getView().byId("invoicesTable"));
		},

		/** 
		 * Handles on press event of accept button
		 * @param {sap.ui.base.Event} [oEvent] oSource and oParameter from the control
		 * 
		 */
		onAcceptInvoicePress: function (oEvent) {
			var aInvoices = this.oComponent.getModel("_SD").getProperty("/SelectedItems");
			this.oComponent._AH.onActionNoInputPress(aInvoices, oEvent.getSource(), this.onAcceptInvoiceSuccess.bind(this), this.onAcceptInvoiceError
				.bind(this));
		},
		onAcceptInvoiceSuccess: function () {
			this._clearListItemSelections();
			this.onRefreshList();
		},
		onAcceptInvoiceError: function () {
			this._clearListItemSelections();
			this.onRefreshList();
		},

		/** 
		 * Handles on press event of edit proposal button
		 * @param {sap.ui.base.Event} [oEvent] oSource and oParameter from the control
		 * 
		 */

		onEditInvoicePress: function (oEvent) {
			var aSelectedFOsBindingContexts = this.getModel("_SD").getProperty("/SelectedItems");
			var aFOsForInvoiceCreation = this.preapreCreateInvoiceObject(aSelectedFOsBindingContexts);
			this.navigateToEditInvoiceView(aFOsForInvoiceCreation[0] ? aFOsForInvoiceCreation[0].TransportationOrderUUID : undefined);
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

		onBeforeRebindTable: function (oEvent) {
			this._addInfoToolbarClearBtn();
			// Clears list item selection, sets default button configuration on column and list filters
			this._clearListItemSelections();
			var oSegmentedButton = this.oSegmentedButton,
				sSelectedButtonId, oSelectedItem;
			if (!sap.ui.Device.system.phone) {
				sSelectedButtonId = oSegmentedButton.getSelectedItem();
				oSelectedItem = this.getView().byId(sSelectedButtonId);
			} else {
				oSelectedItem = oSegmentedButton.getSelectedItem();
			}
			this._filterTableBySegmentedButtonInfo(oSelectedItem, oEvent.getParameter("bindingParams"));
		},

		_filterTableBySegmentedButtonInfo: function (oItem, oBindingParameters) {
			var oFilterStatus;
			var sProperty = oItem.data("property");
			var sStatus = oItem.data("status");
			var sKey = oItem.getKey();
			var aFilters = oBindingParameters.filters;

			//Basic Filter for Invoice worklist - FSDLifeCylceStatus != '00' 
			var basicFilter = new Filter("FSDLifeCycleStatus", FilterOperator.NE, "00");
			aFilters.push(basicFilter);

			switch (sKey) {
			case "All":
				/*oFilterStatus = new Filter(sProperty, FilterOperator.NE, null);
				aFilters.push(oFilterStatus);*/
				var aItems = this.oSegmentedButton.getItems();
				for (var i = 0; i < aItems.length; i++) {
					var sKey = aItems[i].getKey();
					if (sKey !== "All") {
						var sItemStatus = aItems[i].data("status");
						var aStatus;
						if (sItemStatus) {
							aStatus = sItemStatus.split(",");
						} else {
							aStatus = [""];
						}
						for (var j = 0; j < aStatus.length; j++) {
							aFilters.push(new Filter(aItems[i].data("property"), FilterOperator.EQ, aStatus[j]));
						}
					}
				}
				break;
			default:
				var aStatus;
				if (sStatus) {
					aStatus = sStatus.split(",");
				} else {
					aStatus = [];
				}
				for (var j = 0; j < aStatus.length; j++) {
					aFilters.push(new Filter(sProperty, FilterOperator.EQ, aStatus[j]));
				}
			//	oFilterStatus = new Filter(sProperty, FilterOperator.EQ, sStatus);
			}
			
		}

	});
});