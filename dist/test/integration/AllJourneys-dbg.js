sap.ui.define([
	"sap/ui/test/Opa5",
	"./arrangements/Startup",
	"./HomeJourney",
	"./NavigationJourney",
	"./NotFoundJourney",
	"./ObjectJourney"
], function (Opa5, Startup) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Startup(),
		viewNamespace: "com.westernacher.collaborationportal.core.view.",
		autoWait: true
	});

});