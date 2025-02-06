sap.ui.define([
	"com/westernacher/collaborationportal/core/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"com/westernacher/collaborationportal/invoicesubmission/model/formatter",
	"com/westernacher/collaborationportal/core/model/formatter"
], function (BaseController, Controller, DateFormat, Filter, FilterOperator, MessageBox, Fragment, JSONModel, formatter, coreFormatter) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationportal.invoicesubmission.controller.InvoiceSubmissionTable", {

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
			var oSmartTable = this.getView().byId("invoiceSubmissionTable");
			this.oTable = oSmartTable;
			if (!sap.ui.Device.system.phone) {
				this.oSegmentedButton = this.getView().byId("idSegmentedFilter");
			} else {
				this.oSegmentedButton = this.getView().byId("idToolbarFilters");
			}
		},
		onRouteMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "master") {
				return;
			}
			// Clears item selection, Sets default button configuration on navigation
			this._clearListItemSelections();
			this.oComponent._InvoiceSubH.setRoleModel(true, this.getView(), "INVOICE_SUBMISSION", this.oComponent.defaultAnnotation);
			this.getView().getModel().getMetaModel().loaded().then(function (oEvent) {
				if (this.oComponent.ownerComponent) {
					try {
						this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._InvoiceSubH.sUserRole);
					} catch (er) {
						return;
					}
				}
			}.bind(this));
			// if (this.getView().byId("invoiceSubmissionTable").getTable().getBindingInfo("items")) {
			// 	this.onRefreshList();
			// }

		},
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		},

		onCreateInvoicePress: function (oEvent) {
			this.oComponent._InvoiceSubH.onCreateInvoicePress( this.onRefreshList.bind(this)/*this.onRejectSuccess.bind(this), this.onRejectError.bind(this)*/ );
		},

		onRefreshList: function () {
			this.onRefreshTableList(this.getView().byId("invoiceSubmissionTable"));
		}

	});
});