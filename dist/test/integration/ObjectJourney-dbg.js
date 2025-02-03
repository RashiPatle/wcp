/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/Home",
	"./pages/Browser",
	"./pages/Object",
	"./pages/App"
], function (opaTest) {
	"use strict";

	QUnit.module("Object");

	opaTest("Should remember the first item", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		//Actions
		When.onTheHomePage.iRememberTheItemAtPosition(1);

		// Assertions
		Then.onTheHomePage.theTitleShouldDisplayTheTotalAmountOfItems();

		// Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should start the app with remembered item", function (Given, When, Then) {
		// Arrangements
		Given.iRestartTheAppWithTheRememberedItem({
			delay: 1000,
			autoWait: false
		});

		//Actions
		When.onTheAppPage.iWaitUntilTheAppBusyIndicatorIsGone();

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheObjectViewsBusyIndicator().
			and.theObjectViewsBusyIndicatorDelayIsRestored().
			and.iShouldSeeTheRememberedObject();

		// Cleanup
		Then.iTeardownMyApp();
	});


});
