/**This class is automatically generated by LayaAirIDE, please do not make any modifications. */
import View=Laya.View;
import Dialog=Laya.Dialog;
import Scene=Laya.Scene;
var REG: Function = Laya.ClassUtils.regClass;
export module ui.test {
    export class TestSceneUI extends Scene {
		public btnChangeColor:Laya.Button;
        constructor(){ super()}
        createChildren():void {
            super.createChildren();
            this.loadScene("test/TestScene");
        }
    }
    REG("ui.test.TestSceneUI",TestSceneUI);
}