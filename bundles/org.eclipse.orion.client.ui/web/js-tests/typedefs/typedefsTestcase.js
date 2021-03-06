/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define*/
define([
	"chai/chai",
	"orion/Deferred",
	"orion/edit/typedefs",
	"orion/edit/editorContext",
	"orion/serviceregistry"
], function(chai, Deferred, TypeDefRegistry, EditorContext, mServiceRegistry) {
	var assert = chai.assert;
	var ServiceRegistry = mServiceRegistry.ServiceRegistry;

	function setup() {
		var sr = new ServiceRegistry();
		return {
			serviceRegistry: sr,
			typeDefRegistry: new TypeDefRegistry(sr)
		};
	}

	var tests = {};
	tests.test_getTypeDef = function() {
		var result = setup(), serviceRegistry = result.serviceRegistry, typeDefRegistry = result.typeDefRegistry;
		serviceRegistry.registerService("orion.core.typedef", {}, { id: "foo", defs: "myTypeDef" });
		assert.equal(typeDefRegistry.getTypeDef("foo"), "myTypeDef");
	};
	tests.test_getTypeDefLateRegistration = function() {
		var serviceRegistry = new ServiceRegistry();
		serviceRegistry.registerService("orion.core.typedef", {}, { id: "foo", defs: "myTypeDef" });
		var typeDefRegistry = new TypeDefRegistry(serviceRegistry);
		assert.equal(typeDefRegistry.getTypeDef("foo"), "myTypeDef");
	};
	tests.test_getProperties = function() {
		var result = setup(), serviceRegistry = result.serviceRegistry, typeDefRegistry = result.typeDefRegistry;
		serviceRegistry.registerService("orion.core.typedef", {}, {
			id: "foo",
			defs: "myTypeDef",
			other: "zot",
			other2: {bar: 1}
		});
		var props = typeDefRegistry.getProperties("foo");
		assert.equal(Object.keys(props).length, 3);
		assert.equal(props.id, "foo");
		assert.equal(props.other, "zot");
		assert.equal(props.other2.bar, 1);
	};
	tests.test_getAllProperties = function() {
		var result = setup(), serviceRegistry = result.serviceRegistry, typeDefRegistry = result.typeDefRegistry;
		serviceRegistry.registerService("orion.core.typedef", {}, {
			id: "id1",
			defs: "def1",
			other: "zot",
		});
		serviceRegistry.registerService("orion.core.typedef", {}, {
			id: "id2",
			defs: "def2",
			other2: {baz: "qux"}
		});
		var props = typeDefRegistry.getAllProperties();
		assert.equal(Object.keys(props.id1).length, 2);
		assert.equal(props.id1.id, "id1");
		assert.equal(props.id1.other, "zot");

	assert.equal(Object.keys(props.id2).length, 2);
		assert.equal(props.id2.id, "id2");
		assert.equal(props.id2.other2.baz, "qux");
	};
	// Test that we expose the TypeDef into as an "orion.edit.context" service.
	tests.test_editorContextAccessorService = function() {
		var result = setup(), serviceRegistry = result.serviceRegistry;
		serviceRegistry.registerService("orion.core.typedef", {}, { id: "id1", defs: "def1", other:  1 });
		serviceRegistry.registerService("orion.core.typedef", {}, { id: "id2", defs: "def2", other: 2 });

		// Test that TypeDef metadata is provided in Editor Context "options" object.
		var options = EditorContext.getOptions(serviceRegistry);
		assert.equal(Object.keys(options.typeDefs.id1).length, 2);
		assert.equal(options.typeDefs.id1.id, "id1");
		assert.equal(options.typeDefs.id1.other, 1);
		assert.equal(Object.keys(options.typeDefs.id2).length, 2);
		assert.equal(options.typeDefs.id2.id, "id2");
		assert.equal(options.typeDefs.id2.other, 2);

		// Test that TypeDef can be obtained from "getTypeDef()" method of Editor Context service.
		var context = EditorContext.getEditorContext(serviceRegistry);
		return context.getTypeDef("id2").then(function(typeDef) {
			assert.equal(typeDef, "def2");
			return new Deferred().resolve();
		});
	};
	tests.test_serviceRegistrationRequiredProperties = function() {
		var result = setup(), serviceRegistry = result.serviceRegistry;
		assert.throws(function() {
			serviceRegistry.registerService("orion.core.typedef", {}, { id: "foo" });
		}, null, "Missing 'defs' should throw");
		assert.throws(function() {
			serviceRegistry.registerService("orion.core.typedef", {}, { defs: "myTypeDef" });
		}, null, "Missing 'id' should throw");
	};
	return tests;
});