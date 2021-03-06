type Event = any;
type Device = any;
type BluetoothCharacteristic = any;

export enum WeightUnit { GRAMM = 'g', OUNCE = 'oz' }
export enum WeightMode { SCALE_ONLY = 0x01, TIMER_SCALE = 0x02, POUR_OVER = 0x03, ESPRESSO_1 = 0x04, ESPRESSO_2 = 0x05, ESPRESSO_3 = 0x06 }

export default class Jimmy {
   
    private weight?: number = undefined;
    private unit?: WeightUnit = undefined;
    private mode?: WeightMode = undefined;

    private device?: Device = undefined;

    private statusCharacteristic: BluetoothCharacteristic;
    private commandCharacteristic: BluetoothCharacteristic;

    static suuid_hiroiajimmy = "06c31822-8682-4744-9211-febc93e3bece";
	static cuuid_hiroiajimmy_cmd = "06c31823-8682-4744-9211-febc93e3bece";
	static cuuid_hiroiajimmy_status = "06c31824-8682-4744-9211-febc93e3bece";

    async connect(device: Device) {
        this.device = device;

        console.log('Connecting to GATT Server ...');
        const server = await this.device?.gatt.connect();

        console.log('Getting Weight Service ...');
        const service = await server.getPrimaryService(Jimmy.suuid_hiroiajimmy).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
        console.log('Getting Weight Characteristic ...');
        this.statusCharacteristic = await service.getCharacteristic(Jimmy.cuuid_hiroiajimmy_status).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
        this.commandCharacteristic = await service.getCharacteristic(Jimmy.cuuid_hiroiajimmy_cmd).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
        
        console.log('Subscribing ...');
        this.statusCharacteristic.addEventListener('characteristicvaluechanged', (e: Event) => this.parseStatusUpdate(e));

        this.statusCharacteristic.startNotifications().catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
    }

    async disconnect() {
        await this.device?.gatt.disconnect();
        this.device = undefined;
        this.weight = undefined;
        this.unit = undefined;
        this.mode = undefined;
    }

    get weightFormatted() : string {
        if (this.weight === undefined) return '-'
        
        return `${this.weight} ${this.unit}`
    }    

    get modeFormatted() : string {
        if (this.mode === undefined) return '-'
        
        return `${WeightMode[this.mode]}`
    }

    tare() {
        console.log('taring ...')
        const tare = [0x07, 0x00];
        this.send(tare);
    }

    toggleUnit() {
        console.log('toggling Unit ...')
        const toggle = [0x0b, 0x00];
        this.send(toggle);
    }

    toggleMode() {
        console.log('toggling Mode ...')
        const toggle = [0x04, 0x00];
        this.send(toggle);
    }

    toggleTimer() {
        console.log('toggling Timer ...')
        const toggle = [0x05, 0x00];
        this.send(toggle);
    }

    setUnit(unit: WeightUnit) {
        if (this.unit !== unit) {
            this.toggleUnit();
            setTimeout(() => this.setUnit(unit), 500);
        }
    }

    setMode(mode: WeightMode) {
        if (this.mode !== mode) {
            this.toggleMode();
            setTimeout(() => this.setMode(mode), 500);
        }
    }

    private send(cmd: number[]) {
        this.commandCharacteristic.writeValueWithResponse(new Uint8Array(cmd)).catch(async (e: Event) => {
            console.log('FAILED: ' + e);
            return null;
        });
    }

    private parseStatusUpdate(event: Event) {
        const buf = new Uint8Array(event.target.value.buffer);
        const mode = buf[0];
        const sign = buf[6];
        const msw = buf[5];
        const lsw = buf[4];
        
        // timer state is also in buffer, but currently not read by this implemenation
        
        let weight = 256 * msw + lsw;

        if (sign === 255) // negative weight
            weight = (65536-weight) *- 1;

        if (mode > 0x08) {
            this.unit = WeightUnit.OUNCE;
            this.weight = weight / 1000;
            this.mode = (mode - 0x08)
        } else {
            this.unit = WeightUnit.GRAMM;
            this.weight = weight / 10;
            this.mode = mode;
        }

         // console.log(`m: ${mode} w: ${this.weightFormatted}`);
    }
}
