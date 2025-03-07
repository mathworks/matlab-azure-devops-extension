This extension enables you to build and test your MATLAB&reg; project as part of your pipeline. For example, you can automatically identify any code issues in your project, run tests and generate test and coverage artifacts, and package your files into a toolbox.

To run your pipeline using this extension, [install the extension](https://docs.microsoft.com/en-us/azure/devops/marketplace/install-extension?view=azure-devops&tabs=browser) to your Azure&reg; DevOps organization. To install the extension, click the **Get it free** button at the top of this page. You can use the extension with Microsoft&reg;-hosted or self-hosted [agents](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser):

- To use a Microsoft-hosted agent, include the [Install MATLAB](#install-matlab) task in your pipeline to install your preferred MATLAB release on the agent.
- To use a self-hosted agent, set up a computer with MATLAB as your agent and register the agent with Azure Pipelines. (On self-hosted UNIX&reg; agents, you can also use the **Install MATLAB** task instead of having MATLAB installed.) The agent uses the topmost MATLAB release on the system path to execute your pipeline.

## Examples
When you author your pipeline in a file named `azure-pipelines.yml` in the root of your repository, the extension provides you with four different tasks:
- To set up your pipeline with a specific release of MATLAB, use the [Install MATLAB](#install-matlab) task.
- To run a MATLAB build using the MATLAB build tool, use the [Run MATLAB Build](#run-matlab-build) task.
- To run MATLAB and Simulink&reg; tests and generate artifacts, use the [Run MATLAB Tests](#run-matlab-tests) task.
- To run MATLAB scripts, functions, and statements, use the [Run MATLAB Command](#run-matlab-command) task.

### Run a MATLAB Build
On a self-hosted agent that has MATLAB installed, run a MATLAB build task named `mytask`, specified in a build file named `buildfile.m` in the root of your repository, as well as all the tasks on which it depends. To run the MATLAB build, specify the **Run MATLAB Build** task in your pipeline. (The **Run MATLAB Build** task is supported in MATLAB R2022b and later.)

```YAML
pool: myPool
steps:
  - task: RunMATLABBuild@1
    inputs:
      tasks: mytask
``` 

### Generate Test and Coverage Artifacts
Using the latest release of MATLAB on a Microsoft-hosted agent, run the tests in your [MATLAB project](https://www.mathworks.com/help/matlab/projects.html) and generate test results in PDF and JUnit-style XML formats and code coverage results in Cobertura XML format. Publish the generated artifacts to Azure Pipelines once the test run is complete. To install the latest release of MATLAB on the agent, specify the **Install MATLAB** task in your pipeline. To run the tests and generate the artifacts, specify the **Run MATLAB Tests** task.

```YAML
pool:
  vmImage: ubuntu-latest
steps:
  - task: InstallMATLAB@1
  - task: RunMATLABTests@1
    inputs:
      testResultsPDF: test-results/results.pdf
      testResultsJUnit: test-results/results.xml
      codeCoverageCobertura: code-coverage/coverage.xml
  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: test-results/results.pdf
  - task: PublishTestResults@2
    condition: succeededOrFailed()
    inputs:
      testResultsFiles: test-results/results.xml
  - task: PublishCodeCoverageResults@2
    inputs:
      codeCoverageTool: Cobertura
      summaryFileLocation: code-coverage/coverage.xml
``` 

 You can access the artifacts in the pipeline summary window:

- To download the PDF test report, follow the **1 published** link. 
- To view the test results in JUnit-style XML format, open the **Tests** tab.
- To view the code coverage results in Cobertura XML format, open the **Code Coverage** tab.


### Run Tests in Parallel
Run your MATLAB and Simulink tests in parallel (requires Parallel Computing Toolbox&trade;) using the latest release of the required products on a Microsoft-hosted agent. To install the latest release of MATLAB, Simulink, Simulink Test&trade;, and Parallel Computing Toolbox on the agent, specify the **Install MATLAB** task with its `products` input in your pipeline. To run the tests in parallel, specify the **Run MATLAB Tests** task with its `useParallel` input specified as `true`.

```YAML
pool:
  vmImage: ubuntu-latest
steps:
  - task: InstallMATLAB@1
    inputs:
      products: >
        Simulink
        Simulink_Test
        Parallel_Computing_Toolbox
  - task: RunMATLABTests@1
    inputs:
      useParallel: true
``` 

### Run MATLAB Script
Run the commands in a file named `myscript.m` in the root of your repository using MATLAB R2024a on a Microsoft-hosted agent. To install the specified release of MATLAB on the agent, specify the **Install MATLAB** task with its `release` input in your pipeline. To run the script, specify the **Run MATLAB Command** task.

```YAML
pool:
  vmImage: ubuntu-latest
steps:
  - task: InstallMATLAB@1
    inputs:
      release: R2024a
  - task: RunMATLABCommand@1
    inputs:
      command: myscript
```

### Specify MATLAB Release on Self-Hosted Agent
When you use the **Run MATLAB Build**, **Run MATLAB Tests**, or **Run MATLAB Command** task in your pipeline, the agent uses the topmost MATLAB release on the system path. The task fails if the agent cannot find any release of MATLAB on the path.

You can prepend your preferred release of MATLAB to the `PATH` system environment variable of the self-hosted agent. For example, prepend MATLAB R2020b to the path and use it to run a script. The step depends on your operating system and MATLAB root folder.

```YAML
pool: myPool
steps:
  - powershell: Write-Host '##vso[task.prependpath]C:\Program Files\MATLAB\R2020b\bin'  # Windows agent
# - bash: echo '##vso[task.prependpath]/usr/local/MATLAB/R2020b/bin'  # Linux agent
# - bash: echo '##vso[task.prependpath]/Applications/MATLAB_R2020b.app/bin'  # macOS agent
  - task: RunMATLABCommand@1
    inputs:
      command: myscript
```

### Use MATLAB Batch Licensing Token
On a Microsoft-hosted agent, you need a [MATLAB batch licensing token](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md#matlab-batch-licensing-token) if your project is private or if your pipeline includes transformation products, such as MATLAB Coder&trade; and MATLAB Compiler&trade;. Batch licensing tokens are strings that enable MATLAB to start in noninteractive environments. You can request a token by submitting the [MATLAB Batch Licensing Pilot](https://www.mathworks.com/support/batch-tokens.html) form. 

To use a MATLAB batch licensing token:

1. Set the token as a secret variable. For more information about secret variables, see [Set secret variables](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/set-secret-variables?view=azure-devops&tabs=yaml%2Cbash).
2. Map the secret variable to an environment variable named `MLM_LICENSE_TOKEN` in each of the **Run MATLAB Build**, **Run MATLAB Tests**, and **Run MATLAB Command** tasks of your YAML pipeline. 

For example, use the latest release of MATLAB on a Microsoft-hosted agent to run the tests in your private project. To install the latest release of MATLAB on the agent, specify the **Install MATLAB** task in your pipeline. To run the tests, specify the **Run MATLAB Tests** task. In this example, `myToken` is the name of the secret variable that holds the batch licensing token.

```YAML
pool:
  vmImage: ubuntu-latest
steps:
- task: InstallMATLAB@1
- task: RunMATLABTests@1
  env:
    MLM_LICENSE_TOKEN: $(myToken)
```

### Use Virtual Display on Linux Agent
Microsoft-hosted Linux&reg; agents do not provide a display. To run MATLAB code that requires a display, such as tests that interact with an app UI, first set up a virtual display on the agent by starting an Xvfb display server. For example, set up a virtual server to run the tests for an app created in MATLAB.

```YAML
pool:
  vmImage: ubuntu-latest
steps:
  - script: |
      sudo apt-get install -y xvfb
      Xvfb :99 &
      echo "##vso[task.setVariable variable=DISPLAY]:99"
    displayName: Start virtual display server
    condition: eq(variables['Agent.OS'],'Linux') 
  - task: InstallMATLAB@1
  - task: RunMATLABTests@1
```

### Build Across Multiple Platforms
The **Install MATLAB** task supports the Linux, Windows&reg;, and macOS platforms. Use a `matrix` job strategy to run a build using the MATLAB build tool on all the supported platforms. This pipeline runs three jobs.

```YAML
strategy:
  matrix:
    linux:
      imageName: ubuntu-latest
    windows:
      imageName: windows-latest
    mac:
      imageName: macOS-latest
pool:
  vmImage: $(imageName)
steps:
- task: InstallMATLAB@1
- task: RunMATLABBuild@1
  inputs:
    tasks: test
```

## Tasks
You can access the extension tasks using the YAML pipeline editor in Azure DevOps. 

![tasks](https://github.com/mathworks/matlab-azure-devops-extension/assets/48831250/d48ddb8b-a87f-4334-a301-64293b822647)

### Install MATLAB
Use the **Install MATLAB** task to install MATLAB and other MathWorks&reg; products on a Microsoft-hosted (Linux, Windows, or macOS) agent or self-hosted (Linux or macOS) agent. When you specify this task as part of your pipeline, the task installs your preferred MATLAB release (R2021a or later) on an agent and prepends it to the `PATH` system environment variable. If you do not specify a release, the task installs the latest release of MATLAB.

Specify the **Install MATLAB** task in your YAML pipeline as `InstallMATLAB@1`. The task accepts optional inputs.

Input       | Description 
------------| ------------
`release`   | <p>(Optional) MATLAB release to install. You can specify R2021a or a later release. By default, the value of `release` is `latest`, which corresponds to the latest release of MATLAB.</p><p><ul><li>To install the latest update of a release, specify only the release name, for example, `R2024a`.</li><li>To install a specific update release, specify the release name with an update number suffix, for example, `R2024aU4`.</li><li>To install a release without updates, specify the release name with an update 0 or general release suffix, for example, `R2024aU0` or `R2024aGR`.</li></ul></p><p>**Example**: `release: R2024a`<br/>**Example**: `release: latest`<br/>**Example**: `release: R2024aU4`</p>
`products`  | <p>(Optional) Products to install in addition to MATLAB, specified as a list of product names separated by spaces. You can specify `products` to install most MathWorks products and support packages. The task uses [MATLAB Package Manager](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/MPM.md) (`mpm`) to install products.</p><p>For a list of supported products, open the input file for your preferred release from the [`mpm-input-files`](https://github.com/mathworks-ref-arch/matlab-dockerfile/tree/main/mpm-input-files) folder on GitHub&reg;. Specify products using the format shown in the input file, excluding the `#product.` prefix. For example, to install Deep Learning Toolbox&trade; in addition to MATLAB, specify `products: Deep_Learning_Toolbox`.</p><p>For an example of how to use the `products` input, see [Run Tests in Parallel](#run-tests-in-parallel).</p><p>**Example**: `products: Simulink`<br/>**Example:** `products: Simulink Deep_Learning_Toolbox`</p>

#### Licensing
Product licensing for your pipeline depends on your project visibility as well as the type of products to install:

- Public project — If your pipeline does not include transformation products, such as MATLAB Coder and MATLAB Compiler, then the extension automatically licenses any products that you install. If your pipeline includes transformation products, you can request a [MATLAB batch licensing token](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md#matlab-batch-licensing-token) by submitting the [MATLAB Batch Licensing Pilot](https://www.mathworks.com/support/batch-tokens.html) form.
- Private project — The extension does not automatically license any products for you. You can request a token by submitting the [MATLAB Batch Licensing Pilot](https://www.mathworks.com/support/batch-tokens.html) form.
  
To use a MATLAB batch licensing token, first set it as a [secret variable](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/set-secret-variables?view=azure-devops&tabs=yaml%2Cbash). Then, map the secret variable to an environment variable named `MLM_LICENSE_TOKEN` in your YAML pipeline. For an example, see [Use MATLAB Batch Licensing Token](#use-matlab-batch-licensing-token). 

>**Note:** The **Install MATLAB** task automatically includes the [MATLAB batch licensing executable](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md) (`matlab-batch`). To use a MATLAB batch licensing token in a pipeline that does not use this task, you must first download the executable and add it to the system path.


#### Required Software on Self-Hosted Agents
Before using the **Install MATLAB** task to install MATLAB and other products on a self-hosted UNIX agent, verify that the required software is installed on your agent.

##### Linux
If you are using a Linux agent, verify that the following software is installed on your agent:
- Third-party packages required to run the `mpm` command — To view the list of `mpm` dependencies, refer to the Linux section of [Get MATLAB Package Manager](https://www.mathworks.com/help/install/ug/get-mpm-os-command-line.html).
- All MATLAB dependencies — To view the list of MATLAB dependencies, go to the [MATLAB Dependencies](https://github.com/mathworks-ref-arch/container-images/tree/main/matlab-deps) repository on GitHub. Then, open the `<release>/<system>/base-dependencies.txt` file for your MATLAB version and your agent's operating system.

##### macOS
If you are using a macOS agent with an Apple silicon processor, verify that Java&reg; Runtime Environment (JRE&trade;) is installed on your agent. For information about this requirement and to get a compatible JRE version, see [MATLAB on Apple Silicon Macs](https://www.mathworks.com/support/requirements/apple-silicon.html).


>**Note:** The **Install MATLAB** task automatically includes the [MATLAB batch licensing executable](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md) (`matlab-batch`). For an example, see [Use MATLAB Batch Licensing Token](#use-matlab-batch-licensing-token).

### Run MATLAB Build
Use the **Run MATLAB Build** task to run a build using the MATLAB build tool. Starting in R2022b, you can use this task to run the MATLAB build tasks specified in a build file. By default, the **Run MATLAB Build** task looks for a build file named `buildfile.m` in the root of your repository. For more information about the build tool, see [Overview of MATLAB Build Tool](https://www.mathworks.com/help/matlab/matlab_prog/overview-of-matlab-build-tool.html).

Specify the **Run MATLAB Build** task in your YAML pipeline as `RunMATLABBuild@1`. The task accepts optional inputs.

Input                    | Description
-------------------------| ---------------
`tasks`                  | <p>(Optional) MATLAB build tasks to run, specified as a list of task names separated by spaces. If a build task accepts arguments, enclose them in parentheses. If you do not specify `tasks`, the extension task runs the default build tasks in your build file as well as all the tasks on which they depend.</p><p>MATLAB exits with exit code 0 if the build tasks run without error. Otherwise, MATLAB terminates with a nonzero exit code, which causes the extension task to fail.</p><p>**Example:** `tasks: test`<br/>**Example:** `tasks: compile test`<br/>**Example:** `tasks: check test("myFolder",OutputDetail="concise") archive("source.zip")`</p>
`buildOptions`           | <p>(Optional) MATLAB build options, specified as a list of options separated by spaces. The task supports the same [options](https://www.mathworks.com/help/matlab/ref/buildtool.html#mw_50c0f35e-93df-4579-963d-f59f2fba1dba) that you can pass to the `buildtool` command.</p><p>**Example:** `buildOptions: -continueOnFailure`<br/>**Example:** `buildOptions: -continueOnFailure -skip test`</p>
`startupOptions`         | <p>(Optional) MATLAB startup options, specified as a list of options separated by spaces. For more information about startup options, see [Commonly Used Startup Options](https://www.mathworks.com/help/matlab/matlab_env/commonly-used-startup-options.html).</p><p>Using this input to specify the `-batch` or `-r` option is not supported.</p><p>**Example:** `startupOptions: -nojvm`<br/>**Example:** `startupOptions: -nojvm -logfile output.log`</p>

### Run MATLAB Tests
Use the **Run MATLAB Tests** task to run tests authored using the MATLAB unit testing framework or Simulink Test and generate test and coverage artifacts.

By default, the task includes any files in your project that have a `Test` label. If your pipeline does not use a MATLAB project, or if it uses a MATLAB release before R2019a, then the task includes all tests in the root of your repository and in any of its subfolders. The task fails if any of the included tests fail.

Specify the **Run MATLAB Tests** task in your YAML pipeline as `RunMATLABTests@1`. The task accepts optional inputs.

Input                     | Description
------------------------- | ---------------
`sourceFolder`            | <p>(Optional) Location of the folder containing source code, specified as a path relative to the project root folder. The specified folder and its subfolders are added to the top of the MATLAB search path. If you specify `sourceFolder` and then generate a coverage report, the task uses only the source code in the specified folder and its subfolders to generate the report. You can specify multiple folders using a colon-separated or semicolon-separated list.</p><p>**Example:** `sourceFolder: source`<br/>**Example:** `sourceFolder: source/folderA; source/folderB`</p>
`selectByFolder`          | <p>(Optional) Location of the folder used to select test suite elements, specified as a path relative to the project root folder. To create a test suite, the task uses only the tests in the specified folder and its subfolders. You can specify multiple folders using a colon-separated or semicolon-separated list.</p><p>**Example:** `selectByFolder: test`<br/>**Example:** `selectByFolder: test/folderA; test/folderB`</p>
`selectByTag`             | <p>(Optional) Test tag used to select test suite elements. To create a test suite, the task uses only the test elements with the specified tag.</p><p>**Example:** `selectByTag: Unit`</p>
`strict`                  | <p>(Optional) Option to apply strict checks when running tests, specified as `false` or `true`. By default, the value is `false`. If you specify a value of `true`, the task generates a qualification failure whenever a test issues a warning.</p><p>**Example:** `strict: true`</p>
`useParallel`              | <p>(Optional) Option to run tests in parallel, specified as `false` or `true`. By default, the value is `false` and tests run in serial. If the test runner configuration is suited for parallelization, you can specify a value of `true` to run tests in parallel. This input requires a Parallel Computing Toolbox license.</p><p>**Example:** `useParallel: true`</p>
`outputDetail`            | <p>(Optional) Amount of event detail displayed for the test run, specified as `none`, `terse`, `concise`, `detailed`, or `verbose`. By default, the task displays failing and logged events at the `detailed` level and test run progress at the `concise` level.<p></p>**Example:** `outputDetail: verbose`</p>
`loggingLevel`            | <p>(Optional) Maximum verbosity level for logged diagnostics included for the test run, specified as `none`, `terse`, `concise`, `detailed`, or `verbose`. By default, the task includes diagnostics logged at the `terse` level.<p></p>**Example:** `loggingLevel: detailed`</p> 
`testResultsPDF`          | <p>(Optional) Location to write the test results in PDF format, specified as a path relative to the project root folder. On macOS platforms, this input is supported in MATLAB R2020b and later.</p><p>**Example:** `testResultsPDF: test-results/results.pdf`</p>
`testResultsJUnit`        | <p>(Optional) Location to write the test results in JUnit-style XML format, specified as a path relative to the project root folder.</p><p>**Example:** `testResultsJUnit: test-results/results.xml`</p>
`testResultsSimulinkTest` | <p>(Optional) Location to export Simulink Test Manager results in MLDATX format, specified as a path relative to the project root folder. This input requires a Simulink Test license and is supported in MATLAB R2019a and later.</p><p>**Example:** `testResultsSimulinkTest: test-results/results.mldatx`</p>
`codeCoverageCobertura`   | <p>(Optional) Location to write the code coverage results in Cobertura XML format, specified as a path relative to the project root folder.</p><p>**Example:** `codeCoverageCobertura: code-coverage/coverage.xml`</p>
`modelCoverageCobertura`  | <p>(Optional) Location to write the model coverage results in Cobertura XML format, specified as a path relative to the project root folder. This input requires a Simulink Coverage&trade; license and is supported in MATLAB R2018b and later.</p><p>**Example:** `modelCoverageCobertura: model-coverage/coverage.xml`</p>
`startupOptions`         | <p>(Optional) MATLAB startup options, specified as a list of options separated by spaces. For more information about startup options, see [Commonly Used Startup Options](https://www.mathworks.com/help/matlab/matlab_env/commonly-used-startup-options.html).</p><p>Using this input to specify the `-batch` or `-r` option is not supported.</p><p>**Example:** `startupOptions: -nojvm`<br/>**Example:** `startupOptions: -nojvm -logfile output.log`</p>

>**Note:** To customize the pretest state of the system, you can specify startup code that automatically executes before your tests run. For information on how to specify startup or shutdown files in a MATLAB project, see [Automate Startup and Shutdown Tasks](https://www.mathworks.com/help/matlab/matlab_prog/automate-startup-and-shutdown-tasks.html). If your pipeline does not use a MATLAB project, specify the commands you want executed at startup in a `startup.m` file instead, and save the file to the root of your repository. See [`startup`](https://www.mathworks.com/help/matlab/ref/startup.html) for more information.

### Run MATLAB Command
Use the **Run MATLAB Command** task to run MATLAB scripts, functions, and statements. You can use this task to flexibly customize your test run or add a step in MATLAB to your pipeline. 

Specify the **Run MATLAB Command** task in your YAML pipeline as `RunMATLABCommand@1`. The task requires an input and also accepts an optional input.

Input                     | Description
------------------------- | ---------------
`command`                 | <p>(Required) Script, function, or statement to execute. If the value of `command` is the name of a MATLAB script or function, do not specify the file extension. If you specify more than one script, function, or statement, use a comma or semicolon to separate them.</p><p>MATLAB exits with exit code 0 if the specified script, function, or statement executes successfully without error. Otherwise, MATLAB terminates with a nonzero exit code, which causes the task to fail. To fail the task in certain conditions, use the [`assert`](https://www.mathworks.com/help/matlab/ref/assert.html) or [`error`](https://www.mathworks.com/help/matlab/ref/error.html) function.</p><p>**Example:** `command: myscript`<br/>**Example:** `command: results = runtests, assertSuccess(results);`</p>
`startupOptions`         | <p>(Optional) MATLAB startup options, specified as a list of options separated by spaces. For more information about startup options, see [Commonly Used Startup Options](https://www.mathworks.com/help/matlab/matlab_env/commonly-used-startup-options.html).</p><p>Using this input to specify the `-batch` or `-r` option is not supported.</p><p>**Example:** `startupOptions: -nojvm`<br/>**Example:** `startupOptions: -nojvm -logfile output.log`</p>

When you use this task, all of the required files must be on the MATLAB search path. If your script or function is not in the root of your repository, you can use the [`addpath`](https://www.mathworks.com/help/matlab/ref/addpath.html), [`cd`](https://www.mathworks.com/help/matlab/ref/cd.html), or [`run`](https://www.mathworks.com/help/matlab/ref/run.html) function to put it on the path. For example, to run `myscript.m` in a folder named `myfolder` located in the root of the repository, you can specify `command` like this:

`command: addpath("myfolder"), myscript`

## Notes
* By default, when you use the **Run MATLAB Build**, **Run MATLAB Tests**, or **Run MATLAB Command** task, the root of your repository serves as the MATLAB startup folder. To run your MATLAB code using a different folder, specify the `-sd` startup option or include the `cd` command when using the **Run MATLAB Command** task.
* The **Run MATLAB Build** task uses the `-batch` option to invoke the [`buildtool`](https://www.mathworks.com/help/matlab/ref/buildtool.html) command. In addition, in MATLAB R2019a and later, the **Run MATLAB Tests** and **Run MATLAB Command** tasks use  the `-batch` option to start MATLAB noninteractively. Preferences do not persist across different MATLAB sessions launched with the `-batch` option. To run code that requires the same preferences, use a single task.

## See Also
- [Continuous Integration with MATLAB and Simulink](https://www.mathworks.com/solutions/continuous-integration.html)
- [Continuous Integration with MATLAB on CI Platforms](https://www.mathworks.com/help/matlab/matlab_prog/continuous-integration-with-matlab-on-ci-platforms.html)

## Contact Us
If you have any questions or suggestions, contact MathWorks at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
