sap.ui.define([
	"com/westernacher/collaborationportal/core/controller/BaseController",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"com/westernacher/collaborationportal/fosExecution/model/formatter",
	"com/westernacher/collaborationportal/core/model/formatter"
], function (BaseController, DateFormat, Filter, FilterOperator, MessageBox, Fragment, JSONModel, formatter, coreFormatter) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationportal.fosExecution.controller.FOsExecutionTable", {
		formatter: formatter,
		coreFormatter: coreFormatter,
		_aFilters: [],

		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.i18n = this.oComponent.getModel("i18n");
			this.oComponent.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			var oSmartTable = this.getView().byId("fosExecutionTable");
			this.oTable = oSmartTable;
			if (!sap.ui.Device.system.phone) {
				this.oSegmentedButton = this.getView().byId("idSegmentedFilter");
			} else {
				this.oSegmentedButton = this.getView().byId("idToolbarFilters");
			}
			// this.oComponent._ExecH.setRoleModel(true, this.getView(), "EXECUTION", this.oComponent.defaultAnnotation);
			// this.getView().getModel().getMetaModel().loaded().then(function (oEvent) {
			// 	//Do we need that if?
			// 	if (this.oComponent.ownerComponent) {
			// 		try {
			// 			this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._ExecH.sUserRole);
			// 			//	this.oTable.rebindTable();
			// 		} catch (er) {
			// 			return;
			// 		}
			// 	}
			// }.bind(this));
		},
		onRouteMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "master"){
				return;
			}
			// Clears item selection, Sets default button configuration on navigation
			this._clearListItemSelections();
			this.oComponent._ExecH.setRoleModel(true, this.getView(), "EXECUTION", this.oComponent.defaultAnnotation);
			this.getView().getModel().getMetaModel().loaded().then(function () {
				//Do we need that if?
				if (this.oComponent.ownerComponent) {
					try {
						this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._ExecH.sUserRole);
						this.oTable.rebindTable();
					} catch (er) {
						return;
					}
				}
			}.bind(this));
		},
		onTableItemPress: function (oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();
			this.oComponent.getRouter().navTo("object", {
				//	UserRole: this.oComponent._ExecH.sUserRole,
				Key: oBindingContext.getProperty("FreightOrder"),
				UUID: oBindingContext.getProperty("TransportationOrderUUID_F")
			});
		},

		onUploadAttachPress: function (oEvent) {
			this.getOwnerComponent()._AttachH.open(this.getView());
		},

		onTabeSelectionChange: function (oEvent) {
			var aFOBindingContexts = this._prepareBindingContextsDataFromSelectedTableItems();
			this.oComponent._BEH.onTableSelectionChange(aFOBindingContexts);
			this.getView().getModel("_SD").setProperty("/SelectedItems", aFOBindingContexts);
		},
		onCompleteFOPress: function (oEvent) {
			// var aFOs = this._prepareBindingContextsDataFromSelectedTableItems();
			// this.getView().getModel("_SD").setProperty("/SelectedItems", aFOs);
			this.oComponent._ExecH.onCompleteFOPress(oEvent.getSource(), this.onCompleteFOSuccess.bind(this), this.onCompleteFOError.bind(this));
		},

		onCancelFOPress: function (oEvent) {

			this.oComponent._ExecH.onCompleteFOPress(oEvent.getSource(), this.onCancelFOSuccess.bind(this), this.onCancelFOError.bind(this));
		},

		onAcceptFOPress: function (oEvent) {
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			this.oComponent._AH.onActionNoInputPress(aFOs, oEvent.getSource(), this.onAcceptFOSuccess.bind(this), this.onAcceptFOError.bind(
				this));
		},
		onAcceptFOSuccess: function () {
			this._clearListItemSelections();
			this.onRefreshList();
		},
		onAcceptFOError: function () {
			this._clearListItemSelections();
			this.onRefreshList();
		},

		onRejectFOPress: function (oEvent) {
			var aFOs = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			this.oComponent._AH.onActionNoInputPress(aFOs, oEvent.getSource(), this.onRejectFOSuccess.bind(this), this.onRejectFOError.bind(
				this));
		},
		onRejectFOSuccess: function () {
			this._clearListItemSelections();
			this.onRefreshList();
		},
		onRejectFOError: function () {
			this._clearListItemSelections();
			this.onRefreshList();
		},
		onUpdateFOPress: function () {
			this.oComponent._ExecH.onUpdateFreightOrderPress(this.onUpdateWorklistSuccess.bind(this), this.onUpdateWorklistError.bind(this));
		},

		onUpdateWorklistSuccess: function () {
			sap.m.MessageToast.show(this.i18n.getProperty("UpdateConfirmedDatesSuccessMessage"));
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onUpdateWorklistError: function (oController) {
			sap.m.MessageBox.error(this.i18n.getProperty("UpdateConfirmedDatesErrorMessage"), {
				styleClass: "sapUiSizeCompact",
				onClose: null
			});
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onCompleteFOSuccess: function () {
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onCompleteFOError: function () {
			this._clearListItemSelections();
			this.oTable.rebindTable();

		},

		onCancelFOSuccess: function () {
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onCancelFOError: function () {
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		},

		onRefreshList: function () {
			this.onRefreshTableList(this.getView().byId("fosExecutionTable"));
		}

	});
});