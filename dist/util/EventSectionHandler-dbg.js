sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentModuleHandler",
	"com/westernacher/collaborationportal/core/model/formatter",
	"com/westernacher/collaborationportal/core/util/ErrorHandler",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/core/format/DateFormat"
], function (ParentModuleHandler, formatter, ErrorHandler, JSONModel, Filter, FilterOperator, MessageBox, DateFormat) {

	return ParentModuleHandler.extend("com.westernacher.collaborationportal.core.util.EventSectionHandler", {

		reportExpectedEventDialog: 'idReportExpectedEvent',
		reportUnexpectedEventDialog: 'idReportUnexpectedEvent',

		formatter: formatter,

		constructor: function (oController, sEntitySetName) {
			this._oResourceBundle = oController.getModel("i18nhome");
			this._oComponent = oController;
			this._oActionModel = oController.getModel("_AM");
			this._oSelectedFOModel = oController.getModel("_SD");
			this.idTimeline = "idEventsSectionTimeline";
			this.idTimelineItem = "idTimelineItem";
			this._MD = oController._MD;
			this.sEntitySetName = sEntitySetName;
		},

		onFilterBinding: function (oView, sUUID) {
			var oTimelineControl = this.getEventsTimelineControl(oView);
			var oBinding = oTimelineControl.getBinding("content");
			//resuming binding if suspended
			if (oBinding.isSuspended()) {
				oBinding.resume();
			}
			//setting filter on TransportationOrderUUID
			var oFilter = new Filter("TransportationOrderUUID", FilterOperator.EQ, sUUID);
			oBinding.filter(oFilter);
		},

		getEventsTimelineControl: function (oView) {
			if (!this.oTimelineControl) {
				this.oTimelineControl = oView.byId(this.idTimeline);
			}
			return this.oTimelineControl;
		},

		openReportExpectedEvent: function (oEvent) {
			var oSource = oEvent.getSource();
			if (!oSource) {
				return;
			}
			var oEventContext = oSource.getBindingContext();

			//Loading Report Expected Event dialog
			if (!this._reportEventDialog) {
				this._reportEventDialog = sap.ui.xmlfragment(this.reportExpectedEventDialog,
					"com.westernacher.collaborationportal.core.fragment.sections.ReportExpectedEvent", this);
				var oDedicatedModels = [];
				oDedicatedModels.push({
					model: oEventContext.getModel()
				});
				this._bindModelsToFragment(this._reportEventDialog, oDedicatedModels);
				this._reportEventDialog.bindElement(oEventContext.getPath());
			}

			sap.ui.getCore().byId(this.reportExpectedEventDialog + "--idEventReportedDateTime").setDateValue(new Date());
			//Opening Report Expected Event dialog
			this._reportEventDialog.open();
		},

		onReportExpectedEventConfirm: function (oEvent) {
			var oCore = sap.ui.getCore();
			var dActualDate = oCore.byId(this.reportExpectedEventDialog + "--idEventReportedDateTime").getDateValue();
			var sComment = oCore.byId(this.reportExpectedEventDialog + "--idEventComment").getValue();
			var oEventBindingContext = this._reportEventDialog.getBindingContext();

			if (!dActualDate) {
				MessageBox.error("Please Provide Event's Actual Date Time");
				return;
			}
			
			dActualDate = this.convertTimestampToJSonDate(this._convertDatetoString(dActualDate));
			
			//payload for update call - Report Expected Event
			var payLoad = {
				"TransportationOrderUUID": oEventBindingContext.getProperty("TransportationOrderUUID"),
				"EventUUID": oEventBindingContext.getProperty("EventUUID"),
				"ExecutionID": oEventBindingContext.getProperty("ExecutionID"),
				"StopUUID": oEventBindingContext.getProperty("OriginalStopUUID"),
				"EventCode": oEventBindingContext.getProperty("EventCode"),
				"ActualDateTime": dActualDate,
				"ActualTimezone": oEventBindingContext.getProperty("LocationTimeZone"),
				"EventComment": sComment
			};
			//creating the key for the event to be reported
			var sEventPath = oEventBindingContext.getPath();

			//update call for Reporting Expected events
			this.getModel().update(sEventPath, payLoad, {
				success: function (oData, oResponse) {
					this.oTimelineControl.getBinding("content").refresh(true);
					MessageBox.success("Event Reported!", {
						onClose: null,
						styleClass: "sapUiSizeCompact"
					});
				}.bind(this),
				error: function (oErr) {
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);
				}.bind(this),
				merge: false
			});
			this._reportEventDialog.close();
		},

		onCancelReportExpectedEvent: function () {
			this._reportEventDialog.destroy();
			this._reportEventDialog = null;
		},

		//Unexpected Events
		openReportUnexpectedEvent: function (oEvent) {
			oEvent.getSource().getBindingContext();
			//loading Unexpected events dialog
			if (!this._unexpectedEventDialog) {
				this._unexpectedEventDialog = sap.ui.xmlfragment(this.reportUnexpectedEventDialog,
					"com.westernacher.collaborationportal.core.fragment.sections.ReportUnexpectedEvent", this);
				this._bindModelsToFragment(this._unexpectedEventDialog);
				this._oComponent._MD.callEntitySetDataLoad("ZWCP_C_FOEvents", "ZWCP_C_FOEvents", this._oComponent.getModel("_EventsCode"));

			}
			this._oComponent.getModel("_MD").setProperty("/DefaultTimeZoneSet", this._oComponent.ownerComponent.getModel("_MD").getProperty(
				"/DefaultTimeZoneSet"));
			this._unexpectedEventDialog.open();

			this._setUnexpectedEventControls();
			//setting current date time as default actual date time
			var dCurrentDate = new Date();
			this.oActualDate.setDateValue(dCurrentDate);

		},
		_setUnexpectedEventControls: function () {
			var oCore = sap.ui.getCore();

			this.oEventCode = oCore.byId(this.reportUnexpectedEventDialog + "--IdEvent");

			this.oActualDate = oCore.byId(this.reportUnexpectedEventDialog + "--idReportedDate");

			this.oReasonCode = oCore.byId(this.reportUnexpectedEventDialog + "--idReasonCode");

		},
		onSelectionChangeEventCode: function (oEvent) {
			var oEventReasonCode = this.oReasonCode;
			var oSelectedItem = oEvent.getParameter("selectedItem");
			//fetching selected event code
			if (oSelectedItem) {
				this._oComponent._MD.callEntitySetWithFilterDataLoad("ZWCP_C_ReasonByEvent", "EventCodesToEventResons",
					"TranspOrdEventCode", oSelectedItem.getKey(), "",
					this._oComponent.getModel("_EventsReasonCode"));
				oEventReasonCode.setEditable(true);
			} else {
				oEventReasonCode.setEditable(false);
			}

			oEventReasonCode.setSelectedItem(null);
		},

		/**
		 * convert a timestamp into JSON notation
		 * @param {String} oTimestamp: timestamp as string
		 * @returns {String} JSON Date
		 */
		convertTimestampToJSonDate: function (oTimestamp) {
			if (oTimestamp !== null) {
				if (oTimestamp !== "0") {
					var oTicks = Date.UTC(oTimestamp.substr(0, 4), // yyyy
						oTimestamp.substr(4, 2) - 1, // MM
						oTimestamp.substr(6, 2), // dd
						oTimestamp.substr(8, 2), // HH
						oTimestamp.substr(10, 2), // mm
						oTimestamp.substr(12, 2), // ss
						0);
					var oJSonDate = "/Date(" + oTicks + ")/";

					return oJSonDate;
				} else {
					return null;
				}
			} else {
				return null;
			}
		},

		_convertDatetoString: function (oDatePickerDate) {
			var sOldDate = oDatePickerDate.toLocaleString('en-US', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			});

			var aDateTime = sOldDate.split(",");
			var aDate = aDateTime[0].split("/");
			var aTime = aDateTime[1].trim().split(":");

			var sFullYear = aDate[2];
			var sMonth = aDate[0];
			var sDate = aDate[1];
			var sHour = aTime[0];
			var sMinute = aTime[1];
			var sSecond = aTime[2];

			var sFinalDate = sFullYear + sMonth + sDate + sHour + sMinute + sSecond;

			return sFinalDate;
		},

		onReportUnxpectedEventConfirm: function () {
			var oCore = sap.ui.getCore();

			if (!this.validateUserInputForReportUnexpectedEventsDialog()) {
				return;
			}

			//obtaining Unexpected Event values provided by user
			var sEventCode = this.oEventCode.getSelectedItem().getKey();
			var dActualDate = this.oActualDate.getDateValue();
			var sComment = oCore.byId(this.reportUnexpectedEventDialog + "--idEventComment").getValue();
			var sReasonCode = this.oReasonCode.getSelectedItem().getKey();
			var sReasonDesc = oCore.byId(this.reportUnexpectedEventDialog + "--idReasonDescription").getValue();
			dActualDate = this.convertTimestampToJSonDate(this._convertDatetoString(dActualDate));

			var payLoad = {
				"EventCode": sEventCode,
				"ActualDateTime": dActualDate,
				"EventComment": sComment,
				"EventReasonCode": sReasonCode,
				"EventReasonDescription": sReasonDesc,
				"ActualTimezone": this._oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultTimeZoneSet")

			};
			var aFOs = this._oSelectedFOModel.getProperty("/SelectedItems");
			for (var i = 0; i < aFOs.length; i++) {
				var oFO = jQuery.extend(true, {}, payLoad);
				oFO.TransportationOrderUUID = aFOs[i].getProperty("TransportationOrderUUID_F");
				this.getModel().create(this.sEntitySetName, oFO, {
					success: function (oData, oResponse) {
						this.oTimelineControl.getBinding("content").refresh(true);
						MessageBox.success(this._oResourceBundle.getProperty("SuccessMessageCreateUnexpectedEvent"), {
							onClose: null,
							styleClass: "sapUiSizeCompact"
						});
					}.bind(this),
					error: function (oErr) {
						this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);
					}.bind(this)
				});
				this._unexpectedEventDialog.close();
			}

		},
		validateUserInputForReportUnexpectedEventsDialog: function () {
			if (!this.oEventCode.getSelectedItem()) {
				this.setInputStatus(this.oEventCode, "Error", true, this._oResourceBundle.getProperty("ErrorMessageProvideEventCode"));
				return false;
			} else {
				this.setInputStatus(this.oEventCode, "None", false);
			}
			if (!this.oActualDate.getDateValue()) {
				this.setInputStatus(this.oActualDate, "Error", true, this._oResourceBundle.getProperty("ErrorMessageProvideEventDate"));
				return false;
			} else {
				this.setInputStatus(this.oActualDate, "None", false);
			}

			if (!this.oReasonCode.getSelectedItem()) {
				this.setInputStatus(this.oReasonCode, "Error", true, this._oResourceBundle.getProperty("ErrorMessageProvideEventReasonCode"));
				return false;
			} else {
				this.setInputStatus(this.oReasonCode, "None", false);
			}
			return true;
		},
		onCancelReportUnexpectedEvent: function () {
			this._unexpectedEventDialog.destroy();
			this._unexpectedEventDialog = null;
		},
		setInputStatus: function (oInput, sStatus, bStatusTextVisible, sMessage) {
			if (!oInput) {
				return;
			}
			oInput.setValueState(sStatus);
			oInput.setShowValueStateMessage(bStatusTextVisible);
			if (sMessage) {
				oInput.setValueStateText(sMessage);
			}

		}
	});
});