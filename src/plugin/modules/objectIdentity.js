/*global define*/
/*jslint white:true,browser:true*/
define([
], function () {
    'use strict';
    /* singleton */
    function validateId(id) {
        var value;
        /*
         * workspace id must be an positiveinteger or integer string
         */
        if (typeof id === 'number') {
            value = Math.floor(id);
            if (value !== id) {
                throw new Error('Invalid id - not an integer');
            }
        } else if (typeof id === 'string') {
            if (!/^\d+$/.test(id)) {
                throw new Error('Invalid id - string cannot be converted to integer');
            }
            value = parseInt(id);
        } else {
            throw new Error('Invalid id - must be number or string');
        }
        if (value <= 0) {
            throw new Error('Invalid id - must be a positive integer');
        }
        return value;
    }


    function validateName(name) {
        if (typeof name !== 'string') {
            return false;
        }
        /*
         * can't be an integer
         * can't contain a space or a /
         */
        if (/^\d+$/.test(name)) {
            throw new Error('A name must not be coercable to an integer');
        }
        if (/[\s\/]/.test(name)) {
            throw new Error('A name must not contain a space or the / character.');
        }
        return name;
    }

    function makeObjectRef(workspaceId, objectId, objectVersion) {
        if (workspaceId === undefined) {
            throw new Error('The workspace id or name is required for an object ref');
        }
        if (objectId === undefined) {
            throw new Error('The object id or name is required for an object ref');
        }

        var workspace, object, version, ref;

        try {
            workspace = String(this.validateId(workspaceId));
        } catch (ex) {
            try {
                workspace = this.validateName(workspaceId);
            } catch (ex) {
                throw new Error('Workspace identifier not a valid id or name');
            }
        }

        try {
            object = String(this.validateId(objectId));
        } catch (ex) {
            try {
                object = this.validateName(objectId);
            } catch (ex) {
                throw new Error('Object identifier not a valid id or name');
            }
        }

        if (objectVersion) {
            try {
                version = String(this.validateId(objectVersion));
            } catch (ex) {
                throw new Error('Invalid object version supplied');
            }
        }

        ref = [workspace, object];
        if (objectVersion !== undefined) {
            ref.push(version);
        }
        return ref.join('/');

    }

    return {
        validateId: validateId,
        validateName: validateName,
        makeObjectRef: makeObjectRef
    };
});