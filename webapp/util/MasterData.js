sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ParentHandler",
	"sap/m/MessageBox",
	"com/westernacher/collaborationPortal/core/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment", "sap/ui/model/FilterOperator"
], function (ParentHandler, MessageBox, formatter, Filter, Fragment, FilterOperator) {
	"use strict";

	return ParentHandler.extend("com.westernacher.collaborationPortal.core.util.MasterData", {
		formatter: formatter,
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oDataModel = oComponent.getModel();
			this._oMEModel = oComponent.getModel("_MD");
			this._bMessageOpen = false;

		},
		callUserRoleDataLoad: function (fSuccessCall) {
			if (!this._oMEModel.getProperty("/ZWCP_C_BP_INFOLoaded")) {
				this._oDataModel.read("/ZWCP_C_BP_INFO", {
					async: true,
					urlParameters: "$expand=to_Roles/to_Modules",
					success: function (oSuccess) {
						var aUserInfo = oSuccess.results;
						this._assignUserInfoData(aUserInfo[0]);
						this._oMEModel.setProperty("/ZWCP_C_BP_INFOLoaded", true);
						if (fSuccessCall) {
							fSuccessCall();
						}
					}.bind(this)
				});
			} else {
				if (fSuccessCall) {
					fSuccessCall();
				}
			}
		},
		_assignUserInfoData: function (oUserInfoReturend) {
			var oUserInfo = {
				BusinessPartner: oUserInfoReturend.BusinessPartner,
				BusinessPartnerFullName: oUserInfoReturend.BusinessPartnerFullName
			};
			var oRoles = [];
			var aUserRoles = [];
			var oCurrentRole;
			jQuery.each(oUserInfoReturend.to_Roles.results, function (key, val) {
				var oRoleInfo = {};
				oRoleInfo.BusinessPartner = val.BusinessPartner;
				oRoleInfo.BusinessPartnerRole = val.BusinessPartnerRole;
				oRoleInfo.BusinessPartnerRoleShortName = val.BusinessPartnerRoleShortName;
				oRoleInfo.RefreshInterval = val.RefreshInterval;
				oRoleInfo.ServiceURL = val.ServiceURL;
				oRoleInfo.TileIcon = val.TileIcon;

				//	oRoleInfo.to_Modules = val.to_Modules.results;
				oRoleInfo.MicroChart1 = val.MicroChart1;
				oRoleInfo.MicroChart2 = val.MicroChart2;
				oRoleInfo.QuickAction1 = val.QuickAction1;
				oRoleInfo.QuickAction2 = val.QuickAction2;

				oRoleInfo.to_Modules = this._prepareModulesData(val.to_Modules.results);

				//refs/remotes/origin/master
				oRoles[val.BusinessPartnerRole] = oRoleInfo;
				aUserRoles.push(oRoleInfo);

				//Logic to find current role to be changed - Deep 21.09
				if (val.DefaultFlag) {
					oCurrentRole = oRoleInfo;
				}

			}.bind(this));
			oUserInfo.roles = oRoles;
			oUserInfo.CurrentBusinessPartnerRole = oCurrentRole.BusinessPartnerRole;
			oUserInfo.CurrentBusinessPartnerRoleShortName = oCurrentRole.BusinessPartnerRoleShortName;

			this._oMEModel.setProperty("/CurrentRole", oCurrentRole);
			this._oMEModel.setProperty("/UserInfo", oUserInfo);
			this._oMEModel.setProperty("/UserRoles", aUserRoles);
			this._oMEModel.setProperty("/CurrentModules", oCurrentRole.to_Modules);

			//Set User Setting
			this._oMEModel.setProperty("/DefaultUnitForDistSet", oUserInfoReturend.UserUnitOfDistance);
			this._oMEModel.setProperty("/BusinessPartner", oUserInfoReturend.BusinessPartner);
			this._oMEModel.setProperty("/DefaultTimeZoneSet", oUserInfoReturend.UserTimeZone);
		},
		_prepareModulesData: function (aModules) {
			var oModules = {};
			for (var i = 0; i < aModules.length; i++) {
				var oModule = {};
				oModule.BusinessPartnerRole = aModules[i].BusinessPartnerRole;
				oModule.ModuleName = aModules[i].ModuleName;
				oModule.ModuleText = aModules[i].ModuleText;
				oModule.RefreshInterval = aModules[i].RefreshInterval;
				oModule.ServiceBaseURL = aModules[i].ServiceBaseURL;
				oModule.ServiceURL = aModules[i].ServiceURL;
				oModule.TileIcon = aModules[i].TileIcon;
				oModule.ModuleCount = 0;
				oModules[oModule.ModuleName] = oModule;
				oModule.FilterQuery = aModules[i].FilterQuery;
				oModule.CountLabel = aModules[i].CountLabel;
				oModule.AnnotationFileName = aModules[i].AnnotationFileName;
			}
			return oModules;

		},
		setCurrentBusinessRole: function (sBusinessRole) {
			if (!sBusinessRole) {
				return;
			}

			this._oMEModel.setProperty("/UserInfo/CurrentBusinessPartnerRole", sBusinessRole);
			try {
				var aRoles = this._oMEModel.getProperty("/UserInfo/roles");
				var oRole = aRoles[sBusinessRole];
				this._oMEModel.setProperty("/UserInfo/CurrentBusinessPartnerRoleShortName", oRole.BusinessPartnerRoleShortName);
				this._oMEModel.setProperty("/CurrentModules", oRole.to_Modules);
			} catch (er) {
				return;
			}
		},
		callModuleCounts: function (oModel, oModule, fSuccess) {
			var sEntityName = oModule.ServiceURL;
			var iRefreshInterval = oModule.RefreshInterval;
			if (!oModel || !sEntityName || !iRefreshInterval) {
				return;
			}
			var aFilters = [],
				oFilterProp;
			if (oModule.FilterQuery != "") {
				var aProperties = oModule.FilterQuery.split(",");

				aProperties.forEach(function (item) {
					var oProp = item.trim().split(" ");
					var oOperator = oProp[1].toUpperCase();
					oFilterProp = new Filter({
						path: oProp[0],
						operator: oOperator,
						value1: oProp[2].replace("'", "").replace('"', "")
					});
					aFilters.push(oFilterProp);
				});
			}
			var sFilter = new Filter(aFilters);

			oModel.read("/" + sEntityName + "/$count", {
				filters: [sFilter],
				success: function (iCount) {
					if (!iCount) {
						iCount = 0;
					}
					this._oMEModel.setProperty("/CurrentModules/" + oModule.ModuleName + "/ModuleCount", iCount);

					if (fSuccess) {
						fSuccess();
					}

				}.bind(this)
			});
		},
		callEntitySetDataLoad: function (sEntitySetName, sPropertyName, oModel) {
			if (!sEntitySetName) {
				return;
			}

			if (!this._oMEModel.getProperty("/" + sEntitySetName + "Loaded")) {
				if (!oModel) {
					oModel = this.getModel();
				}
				oModel.read("/" + sEntitySetName, {
					success: function (oData, oResponse) {
						var sProperty = sPropertyName ? sPropertyName : sEntitySetName;
						this._oMEModel.setProperty("/" + sProperty, oData.results);
						this._oMEModel.setProperty("/" + sEntitySetName + "Loaded", true);
					}.bind(this),
					error: function (oErr) {

					}
				});
			}
		},
		callEntitySetWithAssociationDataLoad: function (sEntitySetName, sAssociationName, sFilterProperty, sFilterValue, sPropertyName,
			oModel) {
			if (!sEntitySetName || !sAssociationName) {
				return;
			}

			var oMainPropertyLoaded = this._oMEModel.getProperty("/" + sEntitySetName + "Loaded");
			if (!oMainPropertyLoaded || oMainPropertyLoaded.length <= 0) {
				this._oMEModel.setProperty("/" + sEntitySetName + "Loaded", {});
			}
			var oMainProperty = this._oMEModel.getProperty("/" + sEntitySetName);
			if (!oMainProperty || oMainProperty.length <= 0) {
				this._oMEModel.setProperty("/" + sEntitySetName, {});
			}
			if (!this._oMEModel.getProperty("/" + sEntitySetName + "Loaded/" + sFilterValue)) {
				if (!oModel) {
					oModel = this.getModel();
				}
				var oFilter = new Filter(sFilterProperty, "EQ", sFilterValue);
				oModel.read("/" + sEntitySetName, {
					async: true,
					filters: [oFilter],
					success: function (oSuccess) {
						var EventReasons = oSuccess.results;
						var sProperty = sPropertyName ? sPropertyName : sEntitySetName;
						this._oMEModel.setProperty("/" + sProperty + "/Selected" + sAssociationName, EventReasons);
						this._oMEModel.setProperty("/" + sProperty + "/" + sFilterValue, EventReasons);
						this._oMEModel.setProperty("/" + sEntitySetName + "Loaded/" + sFilterValue, true);
					}.bind(this)
				});
			} else {
				var sProperty = sPropertyName ? sPropertyName : sEntitySetName;
				this._oMEModel.setProperty("/" + sProperty + "/Selected" + sAssociationName, this._oMEModel.getProperty("/" + sProperty + "/" +
					sFilterValue));
			}
		},
		callEntitySetWithFilterDataLoad: function (sEntitySetName, sAssociationName, sFilterProperty, sFilterValue, sPropertyName,
			oModel, fnSuccess) {
			if (!sEntitySetName || !sAssociationName) {
				return;
			}

			var oMainPropertyLoaded = this._oMEModel.getProperty("/" + sEntitySetName + "Loaded");
			if (!oMainPropertyLoaded || oMainPropertyLoaded.length <= 0) {
				this._oMEModel.setProperty("/" + sEntitySetName + "Loaded", {});
			}
			var oMainProperty = this._oMEModel.getProperty("/" + sEntitySetName);
			if (!oMainProperty || oMainProperty.length <= 0) {
				this._oMEModel.setProperty("/" + sEntitySetName, {});
			}
			if (!this._oMEModel.getProperty("/" + sEntitySetName + "Loaded/" + sFilterValue)) {
				if (!oModel) {
					oModel = this.getModel();
				}
				var oFilter = new Filter(sFilterProperty, "EQ", sFilterValue);
				oModel.read("/" + sEntitySetName, {
					async: true,
					filters: [oFilter],
					success: function (oSuccess) {
						var EventReasons = oSuccess.results;
						var sProperty = sPropertyName ? sPropertyName : sEntitySetName;
						this._oMEModel.setProperty("/Selected" + sProperty, EventReasons);
						this._oMEModel.setProperty("/" + sProperty + "/" + sFilterValue, EventReasons);
						this._oMEModel.setProperty("/" + sEntitySetName + "Loaded/" + sFilterValue, true);
						if (fnSuccess) {
							fnSuccess();
						}
					}.bind(this)
				});
			} else {
				var sProperty = sPropertyName ? sPropertyName : sEntitySetName;
				this._oMEModel.setProperty("/Selected" + sProperty, this._oMEModel.getProperty("/" + sProperty + "/" +
					sFilterValue));
				if (fnSuccess) {
					fnSuccess();
				}
			}
		}

	});
});