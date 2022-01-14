<template>
  <div>
    <h1>{{ title }}</h1>
    <div>
      <button v-on:click="connect">Connect to Jimmy scale</button>
      <h3>{{ weight }}</h3>
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
h3 {
  margin: 40px 0 0;
}
</style>
