<template>
  <div>
    <h1>{{ title }}</h1>
    <div>
      <button v-on:click="connect">Connect to Jimmy scale</button>
      <button v-on:click="disconnect">Disconnect</button>
      <h3>{{ weight }}</h3>
      <p>Mode: {{ mode }}</p>
      <button v-on:click="tare">Tare</button>
      <button v-on:click="toggleUnit">Toggle Unit</button>
      <button v-on:click="toggleMode">Toggle Mode</button>
      <button v-on:click="toggleTimer">Toggle Timer</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import Jimmy from '@/jimmy'
@Options({
  props: {
    title: String
  }
})
export default class JimmyComponent extends Vue {
  title!: string
  private scale = new Jimmy();

  public get weight () : string { return this.scale.weightFormatted }
  public get mode () : string { return this.scale.modeFormatted }

  public tare() { this.scale.tare() }
  public toggleUnit() { this.scale.toggleUnit() }
  public toggleMode() { this.scale.toggleMode() }
  public toggleTimer() { this.scale.toggleTimer() }

  disconnect (): void { this.scale.disconnect() }
  connect (): void {
    const bt = (navigator as any)?.bluetooth

    if (!bt) alert('Bluetooth is not supported on this browser')
    else {
      bt.requestDevice({
        optionalServices: [Jimmy.suuid_hiroiajimmy.toLowerCase()],
        acceptAllDevices: true
      })
        .then((device: any) => {
          console.log('-> Name:      ' + device.name)
          console.log('-> ID:        ' + device.id)
          if (device.name.indexOf('HIROIA') === 0) {
            this.scale.connect(device)
          }
        }).catch((error: any) => {
          console.log('Error: ' + error)
        })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
button {
  margin: 5px;
}
</style>
