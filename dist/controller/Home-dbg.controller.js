sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/CustomListItem",
	"sap/m/Panel",
	"sap/m/FlexBox",
	"sap/suite/ui/commons/ChartContainer",
	"sap/suite/ui/commons/ChartContainerContent",
	"sap/ui/core/routing/HashChanger",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Sorter, CustomListItem, Panel, FlexBox, ChartContainer,
	ChartContainerContent, HashChanger, MessageToast) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationportal.core.controller.Home", {

		formatter: formatter,
		changeRoleDialogId: "IdDialogChangeRoleWCP",
		changeSettingDialogId: "IdDialogChangeSettingWCP",

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.oComponent.getRouter().getRoute("home").attachPatternMatched(this.onHomePageRouteMatched, this);

			// Adding User Information to header
			this._addUserInfoToHeader();
		},

		/** 
		 * Adds user information UI to header
		 * @private 
		 */
		_addUserInfoToHeader: function () {
			// User info fragment need to be loaded everytime, destroyItems will invalidate all the items
			this._oUserInfo = sap.ui.xmlfragment("com.westernacher.collaborationportal.core.fragment.UserInfoHeader", this);
			this.getView().byId("gridList2").addItem(
				new CustomListItem({
					content: this._oUserInfo
				})
			);
		},

		onHomePageRouteMatched: function (oEvent) {
			this.oComponent._refreshConnection = true;
			this.oComponent.getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},
		_onMetadataLoaded: function () {
			var oUserInfo = this.getModel("_MD").getProperty("/UserInfo");
			if (!oUserInfo || (oUserInfo.CurrentBusinessPartnerRole !== oUserInfo.GeneratedHomePageRole)) {
				this.oComponent._MD.callUserRoleDataLoad(this.assignRoleContent.bind(this));
			} else {
				this.oComponent._MD.callUserRoleDataLoad();
			}
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/*onAfterRendering: function(){
			var oView = this.getView();
			this._adjustChartBox(oView, "idVizFrameRFQ", "idMC2");
		},*/
		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},
		
		/**
		 * Event handler for Freight Agreement RFQs Module
		 * navigating to separate standard app on Fiori Launchpad - Manage Freight Agreement RFQs 
		 * @public
		 */ 
		_navToFreightAgreementRFQ: function(oEvent) {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); 
			
			// generate the Hash - Manage Freight Agreement RFQs Semantic Object & action
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: "TM_FAGRFQCOLLS1",
					action: "Display"
				}
			})) || ""; 
			//Generate a  URL for the Manage Freight Agreement RFQs application
			var url = window.location.href.split('#')[0] + hash; 
			//Navigate to second app
			sap.m.URLHelper.redirect(url, true); 
		},


		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack: function () {
			history.go(-1);
		},
		onModuleItemPress: function (oEvent) {
			//get Pressed Module context 
			var oItem = oEvent.getParameter("listItem").getBindingContext("_MD");
			
			//Added module - Freight Agreement RFQ - navigation to "Manage Freight Agreement RFQ" app
			if (oItem.getProperty("ModuleName") === "AGREEMENT_RFQ"){
				this._navToFreightAgreementRFQ();
			}else {
				sap.ui.core.BusyIndicator.show(0);
				//Assuming module in customizing tables & manifest are in sync
				this.getRouter().navTo(oItem.getProperty("ModuleName"), {
					UserRole: oItem.getProperty("BusinessPartnerRole")
				});
				this.oComponent._refreshConnection = false;
			}
		},
		
		assignRoleContent: function () {
			var sRole = this.getModel("_MD").getProperty("/UserInfo/CurrentBusinessPartnerRole");
			var oModules = this.getModel("_MD").getProperty("/CurrentModules");
			jQuery.each(oModules, function (key, oModule) {
				this._loadModuleModel(oModule);
			}.bind(this));
			this._loadRoleKPIsLayout(this._loadRoleKPIs.bind(this));
			this.getModel("_MD").setProperty("/UserInfo/GeneratedHomePageRole", sRole);
			//this._loadRoleKPIs();
		},

		_loadModuleModel: function (oModule) {
			if (!oModule.ServiceBaseURL) {
				return;
			}
			var oModel;
			if (!this.oComponent.getModel(oModule.ModuleName)) {
				var oConfig = {
					defaultBindingMode: "OneWay"
				};
				oModel = new sap.ui.model.odata.v2.ODataModel(oModule.ServiceBaseURL, oConfig);
				this.oComponent.setModel(oModel, oModule.ModuleName);
			} else {
				oModel = this.oComponent.getModel(oModule.ModuleName);
			}

			var that = this;

			var fRefresh = setInterval(function () {
				that.oComponent._MD.callModuleCounts(oModel, oModule, that._refreshTableBinding.bind(that));
				if (!that.oComponent._refreshConnection) {
					clearInterval(fRefresh);
				}
			}, oModule.RefreshInterval * 1000);
			this.oComponent._MD.callModuleCounts(oModel, oModule, this._refreshTableBinding.bind(this));
		},

		_refreshTableBinding: function () {
			var oBinding = this.getView().byId("modulesList").getBinding("items");
			if (oBinding) {
				oBinding.refresh(true);
			}
		},

		_loadRoleKPIsLayout: function (fCallback) {
			// To destroy all the items, onRouteMatch() calls at every navigation
			this._closeRoleKPIs();
			var oUserInfo = this.getModel("_MD").getProperty("/UserInfo");
			var sCurrentRole = this.getModel("_MD").getProperty("/UserInfo/CurrentBusinessPartnerRole");
			var oCurrentRoleDetail = oUserInfo.roles[sCurrentRole];

			var oGridList = this.getView().byId("gridList2");

			if (oCurrentRoleDetail.MicroChart1 && !sap.ui.getCore().byId("idMC1")) {
				//creating Panel object
				var oPanel1 = new Panel("idMC1", {

				});
				//creating Microchart1 box
				oGridList.addItem(new CustomListItem({
					content: oPanel1
				}));
			}

			if (oCurrentRoleDetail.MicroChart2) {
				oGridList.addItem(new CustomListItem());
			}
			fCallback(oPanel1);
		},

		_loadRoleKPIs: function (oPanel1, oPanel2) {
			var oUserInfo = this.getModel("_MD").getProperty("/UserInfo");
			var sCurrentRole = this.getModel("_MD").getProperty("/UserInfo/CurrentBusinessPartnerRole");
			var oDataVisualisationModel = this.getView().getModel("_DV");
			var oCurrentRoleDetail = oUserInfo.roles[sCurrentRole];

			// destroyitems will invalidate all the aggregation of items
			this.oMicroChart1 = null;
			if (!this.oMicroChart1) {
				if (oCurrentRoleDetail.MicroChart1) {
					var oMicroChart1Config = oDataVisualisationModel.getProperty("/" + oCurrentRoleDetail.MicroChart1);
					if (oMicroChart1Config) {
						this.oMicroChart1 = sap.ui.xmlfragment(sCurrentRole + oMicroChart1Config.idFragment, oMicroChart1Config.fragmentPath, this);

						this.getView().addDependent(this.oMicroChart1);
						this._adjustChartBox(this.getView(), sCurrentRole, oMicroChart1Config.idFragment, oMicroChart1Config.idVizFrame, oPanel1);
					}

				}

			}
			if (!this.oMicroChart2) {
				if (oCurrentRoleDetail.MicroChart2) {
					var oMicroChart2Config = oDataVisualisationModel.getProperty("/" + oCurrentRoleDetail.MicroChart2);
					if (oMicroChart2Config) {
						this.oMicroChart2 = sap.ui.xmlfragment("mc2", oMicroChart2Config.fragmentPath, this);
						this.getView().addDependent(this.oMicroChart2);
					}
				}
			}
			if (!this.oQuickAction1) {
				if (oCurrentRoleDetail.QuickAction1) {
					var oQuickAction1Config = oDataVisualisationModel.getProperty("/" + oCurrentRoleDetail.QuickAction1);
					if (oQuickAction1Config) {
						this.oQuickAction1 = sap.ui.xmlfragment(sCurrentRole + oQuickAction1Config.idFragment, oQuickAction1Config.fragmentPath, this);
						this._bindQuickOverviews(this.oQuickAction1, sCurrentRole, oQuickAction1Config);

					}

					//	this.getView().addDependent(this.oQuickAction1);
				}

			}
			if (!this.oQuickAction2) {
				if (oCurrentRoleDetail.QuickAction2) {
					var oQuickAction2Config = oDataVisualisationModel.getProperty("/" + oCurrentRoleDetail.QuickAction2);
					if (oQuickAction2Config) {
						this.oQuickAction2 = sap.ui.xmlfragment(sCurrentRole + "qa2", oQuickAction2Config.fragmentPath, this);
						this._bindQuickOverviews(this.oQuickAction2, sCurrentRole, oQuickAction2Config);
					}

					//	this.getView().addDependent(this.oQuickAction2);
				}

			}
			//this.getView().byId("idMC1").addContent(this.oMicroChart1);
			//this.getView().byId("idMC2").addContent(this.oMicroChart2);
			this.getView().byId("idQA1").addContent(this.oQuickAction1);
			this.getView().byId("idQA2").addContent(this.oQuickAction2);
		},

		_closeRoleKPIs: function () {
			/*	if (this.getView().byId("idMC1")) {
					this.getView().byId("idMC1").removeContent(this.oMicroChart1);
				}
				if (this.getView().byId("idMC2")) {
					this.getView().byId("idMC2").removeContent(this.oMicroChart2);
				}*/
			if (this.getView().byId("idQA1")) {
				this.getView().byId("idQA1").removeContent(this.oQuickAction1);
			}

			if (this.getView().byId("idQA2")) {
				this.getView().byId("idQA2").removeContent(this.oQuickAction2);
			}

			/*if (this.oMicroChart1) {
				this.oMicroChart1.destroy();
				this.oMicroChart1 = null;
			}

			if (this.oMicroChart2) {
				this.oMicroChart2.destroy();
				this.oMicroChart2 = null;
			}*/

			if (this.oQuickAction1) {
				this.oQuickAction1.destroy();
				this.oQuickAction1 = null;
			}

			if (this.oQuickAction2) {
				this.oQuickAction2.destroy();
				this.oQuickAction2 = null;
			}

			// Destroys all items,  Adds user information again
			this.getView().byId("gridList2").destroyItems();
			this._addUserInfoToHeader();

		},

		onEditRolePress: function (oEvent) {
			if (!this.oChangeRoleDialog) {
				var oFragment = sap.ui.xmlfragment(this.changeRoleDialogId, "com.westernacher.collaborationportal.core.fragment.ChangeRoleDialog",
					this);
				this.oChangeRoleDialog = oFragment;
				this.getView().addDependent(oFragment);
				var oRoleSelect = sap.ui.getCore().byId(this.changeRoleDialogId + "--idSelectRole");
				oRoleSelect.setSelectedKey(this.getModel("_MD").getProperty("/UserInfo/CurrentBusinessPartnerRole"));
				this.oChangeRoleDialog.open();
			}
		},

		onChangeRoleCancel: function (oEvent) {
			this.oChangeRoleDialog.close();
		},
		onChangeRoleConfirm: function (oEvent) {
			var oRoleSelect = sap.ui.getCore().byId(this.changeRoleDialogId + "--idSelectRole");
			var sSelectedRole = oRoleSelect.getSelectedKey();
			this.oComponent._MD.setCurrentBusinessRole(sSelectedRole);
			this._closeRoleKPIs();
			this.assignRoleContent();
			// Changed to call _loadRoleKPIs() to _loadRoleKPIsLayout() to get panels loaded
			//	this._loadRoleKPIsLayout(this._loadRoleKPIs.bind(this));
			this.oChangeRoleDialog.close();
		},
		afterCloseChangeRoleDialog: function (oEvent) {
			this.oChangeRoleDialog.destroy();
			this.oChangeRoleDialog = null;
		},

		onEditSettingPress: function () {
			if (!this.oChangeSettingDialog) {
				var oFragment = sap.ui.xmlfragment(this.changeSettingDialogId,
					"com.westernacher.collaborationportal.core.fragment.ChangeSettingDialog",
					this);
				this.oChangeSettingDialog = oFragment;
				this.getView().addDependent(oFragment);
				var oTimeZoneInput = sap.ui.getCore().byId(this.changeSettingDialogId + "--idTimeZoneInput");
				oTimeZoneInput.setValue(this.getModel("_MD").getProperty("/DefaultTimeZoneSet"));
				this.oChangeSettingDialog.open();
			}

		},

		onChangeSettingConfirm: function (oEvent) {
			// var oRoleSelect = sap.ui.getCore().byId(this.changeRoleDialogId + "--idSelectRole");
			// var sSelectedRole = oRoleSelect.getSelectedKey();
			// this.oComponent._MD.setCurrentBusinessRole(sSelectedRole);
			// this._closeRoleKPIs();
			// this.assignRoleContent();
			// Changed to call _loadRoleKPIs() to _loadRoleKPIsLayout() to get panels loaded
			//	this._loadRoleKPIsLayout(this._loadRoleKPIs.bind(this));

			//Time zone setting
			var oTimeZoneSet = sap.ui.getCore().byId(this.changeSettingDialogId + "--idTimeZoneInput");
			var sTimeZoneSet = oTimeZoneSet.getValue();

			//check validation of entered time zone
			var oDummyDate = new Date();
			try {
				oDummyDate.toLocaleString("en-US", {
					timeZone: sTimeZoneSet
				});
			} catch (err) {
				MessageToast.show(err.message);
				return;
			}

			this.getModel("_MD").setProperty("/DefaultTimeZoneSet", sTimeZoneSet);

			var oSelectedBtn = sap.ui.getCore().byId(this.changeSettingDialogId + "--idUnitForDistRBG").getSelectedButton();
			var sSelectedBtnText = oSelectedBtn.getText();

			if (sSelectedBtnText === "Kilometer") {
				this.getModel("_MD").setProperty("/DefaultUnitForDistSet", "KM");
			} else if (sSelectedBtnText === "Mile") {
				this.getModel("_MD").setProperty("/DefaultUnitForDistSet", "MI");
			}

			var payLoad = {
				"UserTimeZone": this.getModel("_MD").getProperty("/DefaultTimeZoneSet"),
				"UserUnitOfDistance": this.getModel("_MD").getProperty("/DefaultUnitForDistSet")
			};

			var sBusinessPartner = this.getModel("_MD").getProperty("/BusinessPartner");
			this.getModel().sDefaultUpdateMethod = "PUT";
			this.getModel().update("/ZWCP_C_BP_INFO" + "('" + sBusinessPartner + "')", payLoad, {
				success: function (oData, oRes) {
					this.getModel().sDefaultUpdateMethod = "MERGE";
				}.bind(this),
				error: function (oErr) {
					this.getModel().sDefaultUpdateMethod = "MERGE";
				}.bind(this)
			});

			this.oChangeSettingDialog.close();
		},

		onChangeSettingCancel: function (oEvent) {
			this.oChangeSettingDialog.close();
		},
		afterCloseChangeSettingDialog: function (oEvent) {
			this.oChangeSettingDialog.destroy();
			this.oChangeSettingDialog = null;
		},

		callFOButtonAction: function (oEvent) {
			var oButton = oEvent.getSource();
			var oFO = oButton.getBindingContext();
			var fSuccess = function () {
				var oTable = oButton.getParent().getParent().getParent();
				oTable.getBinding('items').refresh(true);
			};
			this.oComponent._AH.onActionNoInputPress([oFO], oButton, fSuccess, null, oFO.getModel());
		},

		onTimeZoneInputLiveChange: function (oEvent) {
			var oInput = oEvent.getSource();
			var sInput = oInput.getValue();
			//contain only letters a-z and A-Z
			sInput = sInput.replace(/[^a-z]+/i, '');
			oInput.setValue(sInput.toUpperCase());
		},

		_bindQuickOverviews: function (oFragment, sCurrentRole, sDataSourceModule) {
			var oDataModel;

			oDataModel = this.getView().getModel(sDataSourceModule.modelName);
			if (!oDataModel) {
				return;
			}

			var oSorter = new Sorter(sDataSourceModule.sortProprty, false);

			var oList = sap.ui.getCore().byId(sCurrentRole + sDataSourceModule.idFragment + "--" + sDataSourceModule.idList);
			var oListTemplate = sap.ui.getCore().byId(sCurrentRole + sDataSourceModule.idFragment + "--" + sDataSourceModule.idListItem);
			oList.bindItems({
				path: "/" + sDataSourceModule.mainEntity,
				model: sDataSourceModule.modelName,
				template: oListTemplate,
				sorter: oSorter
			});
			/*oDataModel.getMetaModel().loaded().then(function (oEvent) {
				this.oComponent._AH.checkUserRoleMetaModel(oDataModel, sCurrentRole);
			}.bind(this));*/

			oDataModel.setSizeLimit(5);
			oFragment.setModel(oDataModel);
		},

		_adjustChartBox: function (oView, sCurrentRole, sFragId, sChartId, oPanel) {
			var oVizFrame = sap.ui.getCore().byId(sCurrentRole + sFragId + "--" + sChartId);

			var oChartContainerContent = new ChartContainerContent({
				content: [oVizFrame]
			});
			var oChartContainer = new ChartContainer("idChartContainerMC1", {
				content: [oChartContainerContent]
			});

			oChartContainer.addStyleClass("sapSuiteUiCommonsChartContainerToolBarArea sapMTBStandard");
			oChartContainer.setShowFullScreen(false);
			oChartContainer.setShowLegend(false);
			oChartContainer.setShowLegendButton(false);
			oChartContainer.setShowZoom(false);
			oChartContainer.setAutoAdjustHeight(false);
			oChartContainer.setFullScreen(false);
			oChartContainer.setEnableScroll(false);
			oPanel.addContent(oChartContainer);
		},

		onQuickOverviewFOClosePickupPress: function (oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var oBindingContext = oEvent.getParameter("listItem").getBindingContext("_CONFPICKUPDUE");
			var sFO = oBindingContext.oModel.getProperty(oBindingContext.sPath).FreightOrder;
			var sCurrentRole = this.getModel("_MD").getProperty("/UserInfo/CurrentBusinessPartnerRole");

			var oHashChanger = HashChanger.getInstance();
			oHashChanger.init();
			var sURI = "FreightOrderConfirmation/" + sCurrentRole + "&/c/FreightOrder/" + sFO;
			oHashChanger.setHash(sURI);
		},

		onQuickOverviewExpiringRFQPress: function (oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var oBindingContext = oEvent.getParameter("listItem").getBindingContext("_RFQQUOTEDUE");
			var sTenderingRequestNumber = oBindingContext.oModel.getProperty(oBindingContext.sPath).TenderingRequestNumber;
			var sTransportationOrderUUID = oBindingContext.oModel.getProperty(oBindingContext.sPath).TransportationOrderUUID;
			var sCurrentRole = this.getModel("_MD").getProperty("/UserInfo/CurrentBusinessPartnerRole");

			var oHashChanger = HashChanger.getInstance();
			oHashChanger.init();
			var sURI = "FreightOrderQuotation/" + sCurrentRole + "&/q/FreightQuotation/" + sTenderingRequestNumber + "," +
				sTransportationOrderUUID;
			oHashChanger.setHash(sURI);
		}

	});
});