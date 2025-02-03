sap.ui.define([
	"com/westernacher/collaborationPortal/core/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"com/westernacher/collaborationPortal/quotation/model/formatter",

	"com/westernacher/collaborationPortal/core/model/formatter",

], function (BaseController, Controller, DateFormat, Filter, FilterOperator, MessageBox, Fragment, JSONModel, formatter, coreFormatter) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationPortal.quotation.controller.QuotationTable", {
		defaultoDataSerice: '/sap/opu/odata/sap/ZWCP_TEND_CRM010_SRV/',

		coreFormatter: coreFormatter,
		formatter: formatter,
		_aFilters: [],

		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.bUploadAttachmentsFlag = false;
			this.i18n = this.oComponent.getModel("i18n");
			this.oComponent.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			// this.oComponent._QuotationH.setRoleModel(true, this.getView(), "QUOTE", this.defaultAnnotation);
			// this.getView().getModel().getMetaModel().loaded().then(function (oEvent) {
			// 	if (this.oComponent.ownerComponent) {
			// 		try {
			// 			this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._QuotationH.sUserRole);
			// 		} catch (er) {
			// 			return;
			// 		}
			// 	}
			// }.bind(this));
			var oSmartTable = this.getView().byId("quotationTable");
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
			this.oComponent._QuotationH.setRoleModel(true, this.getView(), "QUOTE", this.oComponent.defaultAnnotation);
			this.getView().getModel().getMetaModel().loaded().then(function (oEvent) {
				if (this.oComponent.ownerComponent) {
					try {
						this.oComponent._AH.checkUserRoleMetaModel(this.getView().getModel(), this.oComponent._QuotationH.sUserRole);
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
				UserRole: this.oComponent._QuotationH.sUserRole,
				Key: oBindingContext.getProperty("TenderingRequestNumber"),
				FOKey: oBindingContext.getProperty("TransportationOrderUUID")
			});
		},

		onUploadAttachPress: function (oEvent) {
			this.getOwnerComponent()._AttachH.open(this.getView(), this.bUploadAttachmentsFlag);
		},

		onTabeSelectionChange: function (oEvent) {
			var aFOBindingContexts = this._prepareBindingContextsDataFromSelectedTableItems();
			this.oComponent._BEH.onTableSelectionChange(aFOBindingContexts);
			this.getView().getModel("_SD").setProperty("/SelectedItems", aFOBindingContexts);
		},

		onAcceptFOPress: function (oEvent) {
			var aFOs = this.oComponent.getModel("_SD").getProperty("/SelectedItems");
			this.oComponent._AH.onActionNoInputPress(aFOs, oEvent.getSource(), this.onAcceptSuccess.bind(this), this.onAcceptError.bind(this));
		},
		onAcceptSuccess: function (ocontroller) {
			this._clearListItemSelections();
			this.onRefreshList();
		},
		onAcceptError: function (oController) {
			this._clearListItemSelections();
			this.onRefreshList();
		},

		onRejectFOPress: function (oEvent) {
			this.oComponent._QuotationH.onRejectFOPress(this.onRejectSuccess.bind(this), this.onRejectError.bind(this));
		},
		onRejectSuccess: function () {
			sap.m.MessageToast.show(this.i18n.getProperty("quotationMsgReject"));
			//	sap.m.MessageToast.show(this.i18n.getProperty("UpdateConfirmedDatesSuccessMessage"));
			this._clearListItemSelections();
			this.onRefreshList();
		},
		onRejectError: function () {

			this._clearListItemSelections();
			this.onRefreshList();
		},

		onAcceptWithChange: function () {
			this.oComponent._QuotationH.onAcceptWithChangePress(this.onAcceptWithChangeSuccess.bind(this), this.onAcceptWithChangeError.bind(
				this));
		},
		onAcceptWithChangeSuccess: function (oController) {
			sap.m.MessageToast.show(this.i18n.getProperty("quotationMsgUpdate"));
			//	sap.m.MessageToast.show(this.i18n.getProperty("UpdateConfirmedDatesSuccessMessage"));
			this._clearListItemSelections();
			this.onRefreshList();
		},
		onAcceptWithChangeError: function (oController) {
			sap.m.MessageBox.error(this.i18n.getProperty("UpdatePricesErrorMessage"), {
				styleClass: "sapUiSizeCompact",
				onClose: null
			});
			this._clearListItemSelections();
			this.onRefreshList();
		},

		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		},

		onRefreshList: function () {
			this.onRefreshTableList(this.getView().byId("quotationTable"));
		},

		onBeforeRebindRFQTable: function (oEvent) {
			var binding = oEvent.getParameter("bindingParams");
			if (binding.filters.length > 0 && binding.filters[0].aFilters.length > 0) {
				var oFilter;
				for (var i = 0; i < binding.filters[0].aFilters.length; i++) {
					if (binding.filters[0].aFilters[i].aFilters) { //if more than RFQDueDateTime filter is  entered
						for (var j = 0; j < binding.filters[0].aFilters[i].aFilters.length; j++) {
							oFilter = binding.filters[0].aFilters[i].aFilters[j];
							if (oFilter.sPath === "FreightQuotationDueDateTime") {
								if (oFilter.oValue1 instanceof Date) {
									oFilter.oValue1 = this._ConvertDateTimeToUserTimeZone(oFilter.oValue1);
								}
								if (oFilter.oValue2 instanceof Date) {
									oFilter.oValue2 = this._ConvertDateTimeToUserTimeZone(oFilter.oValue2);
								}
							}
						}
					} else {
						//Only RFQDueDateTime filter is  entered
						oFilter = binding.filters[0].aFilters[i];
						if (oFilter.sPath === "FreightQuotationDueDateTime") {
							if (oFilter.oValue1 instanceof Date) {
								oFilter.oValue1 = this._ConvertDateTimeToUserTimeZone(oFilter.oValue1);
							}
							if (oFilter.oValue2 instanceof Date) {
								oFilter.oValue2 = this._ConvertDateTimeToUserTimeZone(oFilter.oValue2);
							}
						}
					}

				}
			}

			this.onBeforeRebindTable(oEvent);
		},

		_ConvertDateTimeToUserTimeZone: function (oDate) {
			// var sFullYear = oDate.getFullYear();
			// var sMonth = oDate.getMonth() + 1;
			// var sDate = oDate.getDate();
			// var sHour = oDate.getHours();
			// var sMinute = oDate.getMinutes();
			// var sSecond = oDate.getSeconds();
			var sTimezone = this.oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultTimeZoneSet");

			var sOldDate = oDate.toLocaleString('en-US', {
				timeZone: sTimezone,
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				hour12: false
			});

			var aDateTime = sOldDate.split(",");
			var aDate = aDateTime[0].split("/");
			var aTime = aDateTime[1].split(":");

			var sFullYear = aDate[2];
			var sMonth = aDate[0] - 1;
			var sDate = aDate[1];
			var sHour = aTime[0] % 24;
			var sMinute = aTime[1];
			var sSecond = aTime[2];

			// var sNewDate = sFullYear + "," + sMonth + "," + sDate + "," + sHour + ":" + sMinute + ":" + sSecond + " " + sTimezone;
			var oNewDate = new Date(sFullYear, sMonth, sDate, sHour, sMinute, sSecond);

			var sDifference = oNewDate.getTime() - oDate.getTime();
			var sFinalDateTimeStamp = oDate.getTime() - sDifference;
			var oFinal = new Date(sFinalDateTimeStamp);

			return oFinal;
		}

	});
});