sap.ui.define([
	"com/westernacher/collaborationportal/core/controller/BaseController",
	"com/westernacher/collaborationportal/confirmation/model/formatter",
	"com/westernacher/collaborationportal/core/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (BaseController, formatter, coreFormatter, Filter, FilterOperator, MessageBox, Fragment, JSONModel) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationportal.freightBooking.controller.freightBookingWorklistTable", {
		_aFilters: [],
		formatter: formatter,
		coreFormatter: coreFormatter,

		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.oComponent.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			this.i18n = this.oComponent.getModel("i18n");
			// this.oComponent._FreightUnitH.setRoleModel(true, this.getView(), "FU", this.oComponent.defaultAnnotation);
			// this.getView().getModel().getMetaModel().loaded().then(function (oEvent) {
			// 	//Do we need that if?
			// 	if (this.oComponent.ownerComponent) {
			// 		try {
			// 			this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._FreightUnitH.sUserRole);
			// 		} catch (er) {
			// 			return;
			// 		}
			// 	}
			// }.bind(this));
			var oSmartTable = this.getView().byId("freightBookingTable");
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
			this.oComponent._FreightBookingH.setRoleModel(true, this.getView(), "FB", this.oComponent.defaultAnnotation);

			this.getView().getModel().getMetaModel().loaded().then(function (oEvent) {
				//Do we need that if?
				if (this.oComponent.ownerComponent) {
					try {
						this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._FreightBookingH.sUserRole);
						this.oTable.rebindTable();
					} catch (er) {
						return;
					}
				}
			}.bind(this));
		},
		onTabeSelectionChange: function (oEvent) {
			var aFOBindingContexts = this._prepareBindingContextsDataFromSelectedTableItems();
			this.oComponent._BEH.onTableSelectionChange(aFOBindingContexts);
			this.getView().getModel("_SD").setProperty("/SelectedItems", aFOBindingContexts);
		},

		onTableItemPress: function (oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();
			this.oComponent.getRouter().navTo("object", {
				UserRole: this.oComponent._FreightBookingH.sUserRole,
				Key: oBindingContext.getProperty("TransportationOrderUUID")
			});
		},

		// onSelectingQuickFilter: function (oEvent) {

		// 	this.oTable.rebindTable();
		// },

		onUploadAttachPress: function (oEvent) {
			this.getOwnerComponent()._AttachH.open(this.getView());
		},

		onAcceptFOPress: function (oEvent) {
			var aFOs = this.oComponent.getModel("_SD").getProperty("/SelectedItems");
			this.oComponent._AH.onActionNoInputPress(aFOs, oEvent.getSource(), this.onAcceptFOSuccess.bind(this), this.onAcceptFOError.bind(
				this));
		},

		onRejectFOPress: function (oEvent) {
			var aFOs = this.oComponent.getModel("_SD").getProperty("/SelectedItems");
			this.oComponent._AH.onActionNoInputPress(aFOs, oEvent.getSource(), this.onRejectFOSuccess.bind(this), this.onRejectFOError.bind(
				this));
		},
		onUpdateFBPress: function () {

			this.oComponent._FreightBookingH.onUpdateFreightBookingPress(this.onUpdateFODatesWorkListSuccess.bind(this), this.onUpdateFODatesWorkListError
				.bind(this));

		},

		onUpdateFODatesWorkListSuccess: function () {
			sap.m.MessageToast.show(this.i18n.getProperty("UpdateConfirmedSuccessMessage"));
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onUpdateFODatesWorkListError: function () {
			sap.m.MessageBox.error(this.i18n.getProperty("UpdateConfirmedErrorMessage"), {
				styleClass: "sapUiSizeCompact",
				onClose: null
			});
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onAcceptFOSuccess: function () {
			this._clearListItemSelections();

			this.oTable.rebindTable();
		},

		onAcceptFOError: function () {
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onRejectFOSuccess: function () {
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onRejectFOError: function () {
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		},

		onRefreshList: function () {
			this.onRefreshTableList(this.getView().byId("freightBookingTable"));
		},

		_updateValidationCheck: function () {},

		onTableUpdateFinished: function () {
			this.oTable.setHeader(this.i18n.getProperty("tableHeaderText") + " (" +
				this.oTable.getTable().getBinding("items").getCurrentContexts().length + ")"
			);
		}

	});
});