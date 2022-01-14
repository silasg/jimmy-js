type Event = any;
type Device = any;
type BluetoothCharacteristic = any;

export enum WeightUnit { GRAM = 'g', OUNCE = 'oz' }
export enum WeightMode { SCALE_ONLY = 0x01, TIMER_SCALE = 0x02, POUR_OVER = 0x03, ESPRESSO_1 = 0x04, ESPRESSO_2 = 0x05, ESPRESSO_3 = 0x06 }

export default class Jimmy {
   
    private weight?: number = undefined;
    private unit?: WeightUnit = undefined;
    private mode?: WeightMode = undefined;

    private device?: Device = undefined;

    private weightCharacteristic: BluetoothCharacteristic;
    private commandCharacteristic: BluetoothCharacteristic;

    static suuid_hiroiajimmy = "06C31822-8682-4744-9211-FEBC93E3BECE";
	static cuuid_hiroiajimmy_cmd = "06C31823-8682-4744-9211-FEBC93E3BECE";
	static cuuid_hiroiajimmy_status = "06C31824-8682-4744-9211-FEBC93E3BECE";

    async connect(device: Device) {
        this.device = device;

        console.log('Connecting to GATT Server ...');
        const server = await this.device?.gatt.connect();

        console.log('Getting Weight Service ...');
        const service = await server.getPrimaryService(Jimmy.suuid_hiroiajimmy.toLowerCase()).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
        console.log('Getting Weight Characteristic ...');
        this.weightCharacteristic = await service.getCharacteristic(Jimmy.cuuid_hiroiajimmy_status.toLowerCase()).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
        this.commandCharacteristic = await service.getCharacteristic(Jimmy.cuuid_hiroiajimmy_cmd.toLowerCase()).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
        
        console.log('Subscribing ...');
        this.weightCharacteristic.addEventListener('characteristicvaluechanged', (e: Event) => this.notification_callback(e));

        this.weightCharacteristic.startNotifications().catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
    }

    async disconnect() {
        await this.device?.gatt.disconnect();
        this.device = undefined;
        this.weight = undefined;
        this.unit = undefined;
    }

    public get weightFormatted() : string {
        if (this.weight === undefined) return '-'
        
        return `${this.weight} ${this.unit}`
    }    

    public get modeFormatted() : string {
        if (this.mode === undefined) return '-'
        
        return `${WeightMode[this.mode]}`
    }    

    notification_callback(event: Event) {
        const buf = new Uint8Array(event.target.value.buffer);
        const mode = buf[0];
        const sign = buf[6];
        const msw = buf[5];
        const lsw = buf[4];
        let weight = 256 * msw + lsw;

        if (sign === 255) // negative weight
            weight = (65536-weight) *- 1;

        if (mode > 0x08) {
            this.unit = WeightUnit.OUNCE;
            this.weight = weight / 1000;
            this.mode = (mode - 0x08)
        } else {
            this.unit = WeightUnit.GRAM;
            this.weight = weight / 10;
            this.mode = mode;
        }

         // console.log(`m: ${mode} w: ${this.weightFormatted}`);
    }

    tare() {
        console.log('taring ...')
        const tare = new Uint8Array(new ArrayBuffer(2));
        tare[0] = 0x07;
        tare[1] = 0x00;
        
        this.commandCharacteristic.writeValueWithResponse(tare).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
    }

    toggleUnit() {
        console.log('toggling Unit ...')
        const toggle = new Uint8Array(new ArrayBuffer(2));
        toggle[0] = 0x0b;
        toggle[1] = 0x00;
        
        this.commandCharacteristic.writeValueWithResponse(toggle).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
    }

}
