sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/core/routing/History"
], function (Controller, UIComponent, mobileLibrary, formatter, Filter, FilterOperator, MessageBox, HashChanger, History) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return Controller.extend("com.westernacher.collaborationportal.core.controller.BaseController", {
		coreFormatter: formatter,
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
		_prepareBindingContextsDataFromSelectedTableItems: function () {
			var aSelectedItems = this.oTable.getTable().getSelectedItems();
			var aFOBindingCentexts = [];
			for (var i = 0; i < aSelectedItems.length; i++) {
				aFOBindingCentexts.push(aSelectedItems[i].getBindingContext());
			}
			return aFOBindingCentexts;
		},
		_prepareBindingContextsDataFromObjectPage: function (othis) {
			var aFOBindingCentexts = [];
			aFOBindingCentexts.push(othis.getView().getBindingContext());
			return aFOBindingCentexts;
		},

		onSelectingQuickFilter: function (oEvent) {
			// Clears list item configuration, sets default button configuration on change of filter buttons
			this._clearListItemSelections();
			this.oTable.rebindTable();
		},

		_filterTableBySegmentedButtonInfo: function (oItem, oBindingParameters) {
			var sProperty = oItem.data("property");
			var sStatus = oItem.data("status");
			var aFilters = oBindingParameters.filters;

			if (sProperty && sProperty !== "All") {
				var aStatus;
				if (sStatus) {
					aStatus = sStatus.split(",");
				} else {
					aStatus = [];
				}
				for (var j = 0; j < aStatus.length; j++) {
					aFilters.push(new Filter(sProperty, FilterOperator.EQ, aStatus[j]));
				} 
			} else {
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
			}
			/*var oBinding = this.oTable.getTable().getBinding('items');
			if (oBinding) {
				oBinding.filter(aFilters);
			} else if (oBindingParameters) {
				oBindingParameters.filters = aFilters;
			}*/                    
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

		onTableSelectionChange: function (oEvent) {
			var aTableBindingContexts = this._prepareBindingContextsDataFromSelectedTableItems();
			this.oComponent._BEH.onTableSelectionChange(aTableBindingContexts);
			this.getView().getModel("_SD").setProperty("/SelectedItems", aTableBindingContexts);
		},
		onTabeSelectionChange: function (oEvent) {
			var aFOBindingContexts = this._prepareBindingContextsDataFromSelectedTableItems();
			this.oComponent._BEH.onTableSelectionChange(aFOBindingContexts);
			this.getView().getModel("_SD").setProperty("/SelectedItems", aFOBindingContexts);
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
				this.onHomeLinkPress();
			}
		},

		/** 
		 * Refreshes the table list or Reload the page if service not found
		 * @param {sap.ui.core.Element} [oTableUI] The table control
		 * 
		 */
		onRefreshTableList: function (oTableUI) {
			// Clears list item selections, sets default button configuratoin on refresh action
			this._clearListItemSelections();
			oTableUI.getTable().getBindingInfo("items").binding.getModel().attachRequestFailed(function (oError) {
				// Popup will be open multiple times based on every call, We refresh the entire page on press of OK. So user will not see multiple errors
				if (oError.getParameter("response") && oError.getParameter("response").statusCode === 503) {
					MessageBox.error(this.oComponent.getModel("i18nhome").getResourceBundle().getText("serviceUnavailableMsg"), {
						details: JSON.stringify(oError.getParameter("response")),
						actions: MessageBox.Action.OK,
						onClose: function (oAction) {
							if (oAction === "OK") {
								window.location.reload();
							}
						}
					});
					return;
				}
			});
			oTableUI.getTable().getBindingInfo("items").binding.getModel().refresh(true);
		},
		/** 
		 * Clears item selections if there is any on navigation
		 * 
		 */
		_clearListItemSelections: function () {
			// Clears selected item if there is any 
			if (this.oTable.getTable().getSelectedItem()) {
				this.oTable.getTable().removeSelections();
			}
			// Sets default button configuration on navigation from detail to list
			this.oTable.getTable().fireSelectionChange();
		},

		/** 
		 * Clears all filters from work list
		 * @param {sap.ui.base.Event} [oEvent] oSource and oParameter from the UI control
		 * 
		 */
		_fnClearAllFilters: function (oEvent) {
			this.oTable.applyVariant({});
		},

		_addInfoToolbarClearBtn: function () {
			var oInfoToolbar = this.oTable.getTable().getInfoToolbar();
			if (oInfoToolbar) {
				// Finds control having 'idClearFiltersIcon' id, if FALSE then adding button to smart table
				var bIsClearFilterBtnExist = oInfoToolbar.getContent().every(function (content) {
					return content.getId() !== this.oTable.getId() + "idClearFiltersIcon";
				}.bind(this));
				if (bIsClearFilterBtnExist) {
					this.oTable.getTable().getInfoToolbar().addContent(new sap.m.ToolbarSpacer());
					this.oTable.getTable().getInfoToolbar().addContent(
						new sap.ui.core.Icon({
							id: this.oTable.getId() + "idClearFiltersIcon",
							src: "sap-icon://sys-cancel",
							tooltip: this.oComponent.getModel("i18nhome").getResourceBundle().getText("clearVariants"),
							press: this._fnClearAllFilters.bind(this)
						}).addStyleClass("sapUiNoMarginEnd")
					);
				}
			}
		}

	});

});