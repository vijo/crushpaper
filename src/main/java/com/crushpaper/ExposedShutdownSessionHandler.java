/*
Copyright 2015 CrushPaper.com.

This file is part of CrushPaper.

CrushPaper is free software: you can redistribute it and/or modify
it under the terms of version 3 of the GNU Affero General Public
License as published by the Free Software Foundation.

CrushPaper is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with CrushPaper.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.crushpaper;

import org.eclipse.jetty.server.session.SessionHandler;

/** Exposes the capability to shutdown all the sessions. */
public class ExposedShutdownSessionHandler extends SessionHandler {
	ExposedShutdownSessionHandler() {
		setSessionManager(new ExposedShutdownHashSessionManager());
	}
}
