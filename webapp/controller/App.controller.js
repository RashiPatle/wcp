sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/HashChanger"
], function (BaseController, JSONModel, HashChanger) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationPortal.core.controller.App", {

		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// disable busy indication when the metadata is loaded and in case of errors
			this.getOwnerComponent().getModel().metadataLoaded().
			then(fnSetAppNotBusy);
			this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			var oHashChanger = HashChanger.getInstance();
			oHashChanger.init();
			var sHash = oHashChanger.getHash();
			var aHash = sHash.split("/");
			if ((aHash[0] === "FreightOrderExecution") || (aHash[0] === "FreightOrderConfirmation") || (aHash[0] === "FreightOrderQuotation") ||
				(aHash[0] === "FreightOrderSettlement") || (aHash[0] === "Invoices") || (aHash[0] === "FU") || (aHash[0] === "FB")) {

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onAppMetadataLoaded.bind(this));

			}

		},

		_onAppMetadataLoaded: function () {
			this.getOwnerComponent()._MD.callUserRoleDataLoad(this._assignRoleInfoToComponent.bind(this));
		},

		_assignRoleInfoToComponent: function (oCurrentRole) {
			this.getOwnerComponent()._MD.setCurrentBusinessRole(oCurrentRole);
		}

	});

});