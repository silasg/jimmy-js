<template>
  <div>
    <h1>{{ title }}</h1>
    <div>
      <button v-on:click="connect">Connect to Jimmy scale</button>
      <h3>{{ weight }}</h3>
      <button v-on:click="tare">Tare</button>
      <button v-on:click="toggleUnit">Toggle Unit</button>
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

  public get weight () : string {
    return this.scale.weightFormatted
  }

  public tare() { this.scale.tare() }
  public toggleUnit() { this.scale.toggleUnit() }

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
