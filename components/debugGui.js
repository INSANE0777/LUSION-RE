import GUI from "lil-gui";

export const debugGui = new GUI();
debugGui.close();

if (process.env.NODE_ENV !== "development") {
    debugGui.hide();
}