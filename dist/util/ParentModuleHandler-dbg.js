sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentHandler",
	"sap/m/MessageBox"
], function (ParentHandler, MessageBox) {
	"use strict";

	return ParentHandler.extend("com.westernacher.collaborationportal.core.util.ParentModuleHandler", {

		setRoleModel: function (isCurrent, oView, sModule, sAnnotation) {
			var oMDModel = this._oComponent.ownerComponent.getModel("_MD");

			if (this._oComponent.sRole) {
				this._oComponent.ownerComponent._MD.setCurrentBusinessRole(this._oComponent.sRole);
			}
			var oUserInfo = oMDModel.getProperty("/UserInfo");
			this.sUserRole = oUserInfo.CurrentBusinessPartnerRole;

			var oRoleDetails = oUserInfo.roles[this.sUserRole];
			var oModel = oView.getModel(this.sUserRole);
			if (!oModel) {
				var oModuleInfo = oRoleDetails.to_Modules[sModule];
				var sServiceURL = oModuleInfo.ServiceBaseURL;

				var sAnnotationPath = oModuleInfo.AnnotationFileName ? jQuery.sap.getModulePath(sAnnotation) + "/" + oModuleInfo.AnnotationFileName :
					"";

				var oConfig = {
					annotationURI: sAnnotationPath,
					defaultBindingMode: "OneWay",
					defaultCountMode: "None"
				};
				oModel = new sap.ui.model.odata.v2.ODataModel(sServiceURL, oConfig);

				oView.setModel(oModel, this.sUserRole);
				oModel.attachRequestSent(function () {
					this._openBusyDialog();
				}.bind(this));
				oModel.attachRequestCompleted(function () {
					this._closeBusyDialog();
				}.bind(this));

			}
			if (isCurrent) {
				oView.setModel(oModel);
				this._oComponent.setModel(oModel);
			}

			return oModel;
		},

		_openBusyDialog: function () {
			// instantiate busy dialog
			if (!this._oBusyDialog) {
				this._oBusyDialog = sap.ui.xmlfragment("com.westernacher.collaborationportal.core.fragment.BusyDialog",
					this);
			}

			this._oBusyDialog.open();
		},
		_closeBusyDialog: function () {
			if (this._oBusyDialog) {
				this._oBusyDialog.close();
				this._oBusyDialog.destroy(true);
				this._oBusyDialog = null;
			} else {
				return;
			}
		},

		_bindModelsToFragment: function (oFragment, aDedicatedModels) {
			oFragment.setModel(this._oComponent.getModel());
			oFragment.setModel(this._oComponent.getModel("i18n"), "i18n");
			oFragment.setModel(this._oComponent.getModel("i18nhome"), "i18nhome");
			oFragment.setModel(this._oComponent.getModel("_MD"), "_MD");
			if(aDedicatedModels){
				for(var i = 0; i< aDedicatedModels.length ; i++){
					var oModel = aDedicatedModels[i];
					oFragment.setModel(oModel.model, oModel.name);
				}
			}
			
		},
		_bindItemDataToFragment: function (aItems, oFragment, oConfig) {
			if(!oConfig){
				oConfig = {};
			}
			if (aItems.length === 1) {
				oFragment.bindElement(aItems[0].getPath(), oConfig);
			}
		}
	});
});