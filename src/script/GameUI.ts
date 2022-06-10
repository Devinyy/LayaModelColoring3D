import { ui } from "./../ui/layaMaxUI";
/**
 * 本示例采用非脚本的方式实现，而使用继承页面基类，实现页面逻辑。在IDE里面设置场景的Runtime属性即可和场景进行关联
 * 相比脚本方式，继承式页面类，可以直接使用页面定义的属性（通过IDE内var属性定义），比如this.tipLbll，this.scoreLbl，具有代码提示效果
 * 建议：如果是页面级的逻辑，需要频繁访问页面内多个元素，使用继承式写法，如果是独立小模块，功能单一，建议用脚本方式实现，比如子弹脚本。
 */
export default class GameUI extends ui.test.TestSceneUI {
    
    constructor() {
        super();


        // Laya.Stat.show();

        Laya.Scene3D.load('res/LayaScene_SampleScene/Conventional/SampleScene.ls', Laya.Handler.create(this, (scene: Laya.Scene3D) => {
            Laya.stage.addChildAt(scene, 0);
            this.camera = scene.getChildByName('Main Camera') as Laya.Camera;
            // this.targetSprite3D = scene.getChildByName('DragonFruit2').getChildAt(0) as Laya.MeshSprite3D;
            this.targetSprite3D = scene.getChildByName('DragonFruit2') as Laya.MeshSprite3D;
            Laya.loader.create('prefab/pen2.json', Laya.Handler.create(this, (pen: Laya.Prefab) => {
                this.Pen = pen;
                //在舞台上添加鼠标事件监听
                Laya.stage.on(Laya.Event.MOUSE_DOWN,this, this.onMouseDown);
                Laya.stage.on(Laya.Event.MOUSE_MOVE,this, this.onMouseDown);
            }));
        }));

        if(!this.box)
        {
            this.box = new Laya.Box();
            this.box.width = 256;
            this.box.height = 256;
            this.box.x = 0;
            this.box.y = 0;
            let box2 = new Laya.Image();
            box2.width = 256;
            box2.height = 256;
            box2.skin = 'DragonFruit_DragonFruit_AlbedoTransparency.jpg';
            this.box.addChild(box2);
            box2.x = 0;
            box2.y = 0;
        }

        this.btnChangeColor.on(Laya.Event.CLICK, this, () => {
            console.log("改变颜色");
            if(this.penColor.r == 255)
            {
                this.penColor.r = 0;
                this.penColor.g = 255;
                this.penColor.b = 0;
            }
            else if(this.penColor.g == 255)
            {
                this.penColor.r = 0;
                this.penColor.g = 0;
                this.penColor.b = 255;
            }
            else
            {
                this.penColor.r = 255;
                this.penColor.g = 0;
                this.penColor.b = 0;
            }
        });

    }


    penColor = new Laya.Color(255,0,0,255);

    camera: Laya.Camera;
    targetSprite3D: Laya.MeshSprite3D;
    _checkPoint: number[];
    DrawPath: number[];
    Pen: Laya.Prefab;

    box: Laya.Box = null;

    onMouseDown()
    {

        this._checkPoint = [];
        this.DrawPath = [];

        let ray: Laya.Ray = new Laya.Ray(fl.v3(), fl.v3());
        this.camera.viewportPointToRay(fl.v2(Laya.stage.mouseX, Laya.stage.mouseY), ray);
        var poss:Laya.Vector3[] = [];
        this.targetSprite3D.meshFilter.sharedMesh.getPositions(poss);
        // console.log('poss', poss);
        var data = this.targetSprite3D.meshFilter.sharedMesh.getIndices();
        var uvs:Laya.Vector2[] = [];
        this.targetSprite3D.meshFilter.sharedMesh.getUVs(uvs);
        // console.log('uvs', uvs);
        let indexArray:number[] = [];
        for (var i = 0; i < data.length; i += 3) {
            var v0 = fl.v3Add(GameUI.TransformQuat(poss[data[i]], this.targetSprite3D.transform.rotation), this.targetSprite3D.transform.position);
            var v1 = fl.v3Add(GameUI.TransformQuat(poss[data[i + 1]], this.targetSprite3D.transform.rotation), this.targetSprite3D.transform.position);
            var v2 = fl.v3Add(GameUI.TransformQuat(poss[data[i + 2]], this.targetSprite3D.transform.rotation), this.targetSprite3D.transform.position);
            if (this.IsRayIntersectTriangle(ray.origin, ray.direction, v0, v1, v2)) {
                indexArray.push(i);
                // 计算当前顶点的距离
                this._checkPoint.push(Laya.Vector3.distance(ray.origin, v0));
            }
        }
        // console.log(indexArray);
        // console.log(this._checkPoint);
        if (indexArray.length == 0)
            return;
        
        var minT = 99999;
        var index = -1;
        for (var i = 0; i < this._checkPoint.length; i++) {
            if (this._checkPoint[i] < minT) {
                minT = this._checkPoint[i];
                index = indexArray[i];
            }
        }

        var pointPos = fl.v3Add(ray.origin, fl.v3Mul(ray.direction, minT));
        var invert = new Laya.Quaternion();
        this.targetSprite3D.transform.rotation.invert(invert);
        var c0 = poss[data[index]];
        var c1 = poss[data[index + 1]];
        var c2 = poss[data[index + 2]];

        var childPos = GameUI.TransformQuat(fl.v3Sub(pointPos, this.targetSprite3D.transform.position), invert);
        var angle = this.getV3AngleIsPositive(fl.v3Sub(c1, c0),
            fl.v3Sub(c2, c0));
        var angle2 = this.getV3AngleIsPositive(fl.v3Sub(c1, c0),
            fl.v3Sub(childPos, c0));
        var distance = Laya.Vector3.distance(childPos, poss[data[index]]) / Laya.Vector3.distance(poss[data[index + 1]], poss[data[index]]);
        var u0 = uvs[data[index]];
        var u1 = uvs[data[index + 1]];
        var u2 = uvs[data[index + 2]];
        if (angle2 > angle) {
            angle2 = angle;
        }
        var newVec2 = this.getPointByRadian(u1.x - u0.x, u1.y - u0.y, angle2);
        newVec2 = fl.v2Mul(newVec2, distance);
        newVec2 = fl.v2Add(u0, newVec2);
        var material = this.targetSprite3D.meshRenderer.material as Laya.BlinnPhongMaterial;
        var tex = material.albedoTexture as Laya.Texture2D;

        var array = tex.getPixels();
        var pixeIUVx = newVec2.x;
        var pixeIUVy = newVec2.y;
        pixeIUVx *= tex.width;
        pixeIUVy *= tex.height;
        pixeIUVx = Math.floor(pixeIUVx);
        pixeIUVy = Math.floor(pixeIUVy);
        // console.log(pixeIUVx, pixeIUVy);
        let startx = pixeIUVx - 5;
        if(startx < 0) startx = 0;
        let starty = pixeIUVy - 5;
        if(starty < 0) starty = 0;
        let endx = pixeIUVx + 5;
        if(endx > 1024) endx = 1024;
        let endy = pixeIUVy + 5;
        if(endy > 1024) endy = 1024;
        for(let i = startx; i < endx; i++)
        {
            for(let j = starty; j < endy; j++)
            {
                this.DrawPath.push(j);
                this.DrawPath.push(i);
            }
        }

        // 方法一  ================ 像素点 ===================
        let newTexture2d = new Laya.Texture2D(256, 256, Laya.TextureFormat.R8G8B8A8, false, true);

        // for (var i = 0; i < this.DrawPath.length; i += 2) {
        //     // let e = pixeIUVx + this.DrawPath[i] + (pixeIUVy + this.DrawPath[i + 1]) * tex.width;
        //     let e = this.DrawPath[i] * 1024 + this.DrawPath[i + 1] * 4;
        //     let colora = new Laya.Color(array[e], array[e+1], array[e+2], 255);
        //     let colorb = this.penColor;
        //     let colorresult = this.NormalBlend(colora, colorb);
        //     console.log(colorresult);
        //     array[e] = colorresult.r;
        //     array[e + 1] = colorresult.g;
        //     array[e + 2] = colorresult.b;
        //     array[e + 3] = 255;
        // }
        
        // tex.setPixels(array);
        // newTexture2d.setPixels(array);
        // material.albedoTexture = newTexture2d;

        var rtex = new Laya.Texture(((<Laya.Texture2D>(newTexture2d))), Laya.Texture.DEF_UV);
        var sp: Laya.Sprite = new Laya.Sprite(); //创建精灵 
        sp.name = 'pixel';
        sp.graphics.drawTexture(rtex); //把截图绘制到精灵上 
        Laya.stage.addChild(sp); //把精灵显示到舞台

        // 方法二  ================ CanvasRender ===================
        if(this.Pen)
        {
            this.box.removeSelf();
            let pen = new Laya.Prefab();
            pen.json = this.Pen;
            let penobj = Laya.Pool.getItemByCreateFun('pen2', pen.create, pen);
            this.box.addChild(penobj);
            penobj.pos(pixeIUVx, pixeIUVy);
            Laya.stage.addChild(this.box);
            this.box.right = 0;
            Laya.timer.frameOnce(1, this, () => {
                let htmlCanvas = this.box.drawToCanvas(256, 256, this.box.x, 0) as Laya.HTMLCanvas;
                let rendertest = htmlCanvas.getTexture() as unknown as Laya.RenderTexture2D;
                let sp1:Laya.Sprite = new Laya.Sprite();//创建精灵 
                sp1.name = 'render';
                sp1.graphics.drawTexture(htmlCanvas.getTexture() as Laya.Texture);//把截图绘制到精灵上 
                Laya.stage.addChild(sp);//把精灵显示到舞台
                sp1.pos(512, 0);
                material.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_OPAQUE;
                material.albedoTexture = rendertest;
                material.albedoColor = new Laya.Vector4(1, 1, 1, 1);
            });
        }
        
    }

    // 颜色混合
    NormalBlend(background: Laya.Color, cover: Laya.Color): Laya.Color
    {
        if(background.a == 255 && background.g == 255 && background.b == 255)
        {
            return cover;
        }
        let blendColor = new Laya.Color();
        blendColor.a = 1;
        blendColor.r = (cover.r + background.r) / 2;
        blendColor.g = (cover.g + background.g) / 2;
        blendColor.b = (cover.b + background.b) / 2;
        return blendColor;
    }

    /** 三角面碰撞算法 */
    IsRayIntersectTriangle(orig: Laya.Vector3, dir: Laya.Vector3, v0: Laya.Vector3, v1: Laya.Vector3, v2: Laya.Vector3) {
        var t = -1;
        var u = -1;
        var v = -1;
        var E1 = fl.v3Sub(v1, v0);
        var E2 = fl.v3Sub(v2, v0);
        var P = fl.v3(0, 0, 0);
        Laya.Vector3.cross(dir, E2, P);
        var det = Laya.Vector3.dot(E1, P);
        var T = fl.v3(0, 0, 0);
        if (det > 0) {
            T = fl.v3Sub(orig, v0);
        } else {
            T = fl.v3Sub(v0, orig);
            det = -det;
        }

        var espX = 0.00001;
        if (det < espX)
            return false;
        u = Laya.Vector3.dot(T, P);
        if (u < -espX || u > det)
            return false;
        var Q = fl.v3(0, 0, 0);
        Laya.Vector3.cross(T, E1, Q);
        v = Laya.Vector3.dot(dir, Q);
        if (v < -espX || u + v > det + espX)
            return false;
        t = Laya.Vector3.dot(E2, Q);
        var fInvDet = 1.0 / det;
        t *= fInvDet;
        u *= fInvDet;
        v *= fInvDet;
        return true;
    }
    /**夹角计算 */
    getV3AngleIsPositive(up: Laya.Vector3, startUp: Laya.Vector3, startForward: Laya.Vector3 = fl.v3(), isPositive: boolean = true): number {
        Laya.Vector3.normalize(up, up);
        Laya.Vector3.normalize(startUp, startUp);
        let angle = Math.acos(Laya.Vector3.dot(up, startUp)) * (180 / Math.PI);
        if (startForward != fl.v3()) {
            let dotValue = Laya.Vector3.dot(up, startForward);
            if (isPositive) {
                angle = dotValue >= 0 ? angle : 360 - angle;
            }
            else {
                angle = dotValue >= 0 ? angle : -angle;
            }
        }
        if (Number.isNaN(angle)) angle = 0;
        return angle;
    }
    /**uv旋转 */
    getPointByRadian(x: number, y: number, angle: number): Laya.Vector2 {
        var newPoint: Laya.Vector2 = new Laya.Vector2();
        var radian: number = Laya.Utils.toRadian(angle);
        newPoint.x = x * Math.cos(radian) - y * Math.sin(radian);
        newPoint.y = x * Math.sin(radian) + y * Math.cos(radian);
        return newPoint;
    }

    /**向量旋转 */
    public static TransformQuat(source: Laya.Vector3, rotation: Laya.Quaternion) {
        var x = source.x;
        var y = source.y;
        var z = source.z;
        var qx = rotation.x;
        var qy = rotation.y;
        var qz = rotation.z;
        var qw = rotation.w;

        var ix = qw * x + qy * z - qz * y;
        var iy = qw * y + qz * x - qx * z;
        var iz = qw * z + qx * y - qy * x;
        var iw = -qx * x - qy * y - qz * z;

        return new Laya.Vector3(ix * qw + iw * -qx + iy * -qz - iz * -qy, iy * qw + iw * -qy + iz * -qx - ix * -qz, iz * qw + iw * -qz + ix * -qy - iy * -qx);
    }

}

export class fl
{
    public static v3(x: number = 0, y: number = 0, z: number = 0): Laya.Vector3
    {
        return new Laya.Vector3(x, y, z);
    }

    public static v2(x: number = 0, y: number = 0): Laya.Vector2
    {
        return new Laya.Vector2(x, y);
    }
    
    public static v3Add(v1: Laya.Vector3, v2: Laya.Vector3): Laya.Vector3
    {
        let out:Laya.Vector3 = new Laya.Vector3();
        Laya.Vector3.add(v1, v2, out);
        return out;
    }

    public static v3Sub(v1: Laya.Vector3, v2: Laya.Vector3): Laya.Vector3
    {
        let out:Laya.Vector3 = new Laya.Vector3();
        Laya.Vector3.subtract(v1, v2, out);
        return out;
    }

    public static v3Mul(v1: Laya.Vector3, scale: number): Laya.Vector3
    {
        let out:Laya.Vector3 = new Laya.Vector3();
        Laya.Vector3.scale(v1, scale, out);
        return out;
    }

    public static v2Add(v1: Laya.Vector2, v2: Laya.Vector2): Laya.Vector2
    {
        let out = null;
        out = new Laya.Vector2(v1.x + v2.x, v1.y + v2.y);
        return out;
    }

    public static v2Mul(v1: Laya.Vector2, scale: number): Laya.Vector2
    {
        let out:Laya.Vector2 = new Laya.Vector2();
        Laya.Vector2.scale(v1, scale, out);
        return out;
    }
    

}

export class NewToonMaterial extends Laya.BlinnPhongMaterial
{


}
