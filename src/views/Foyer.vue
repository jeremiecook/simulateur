<template>
  <div class="foyer">
    <router-view/>
    <FoyerRecap></FoyerRecap>
  </div>
</template>

<script>
import FoyerRecap from '@/components/FoyerRecap.vue'

export default {
  name: 'foyer',
  components: {
    FoyerRecap
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.foyer {
  background-color: whitesmoke;
  padding: 1em 0em;
}

pre {
  text-align: left;
}
</style>